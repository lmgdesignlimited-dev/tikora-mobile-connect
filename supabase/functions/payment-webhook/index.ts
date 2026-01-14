import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    const gateway = req.headers.get('x-korapay-signature') ? 'korapay' : 'flutterwave';

    console.log(`Received ${gateway} webhook:`, JSON.stringify(payload));

    let reference: string;
    let status: string;
    let amount: number;

    if (gateway === 'korapay') {
      // Verify KoraPay signature if needed
      const event = payload.event;
      const data = payload.data;
      
      if (event === 'charge.success') {
        reference = data.reference;
        status = 'completed';
        amount = data.amount;
      } else if (event === 'charge.failed') {
        reference = data.reference;
        status = 'failed';
        amount = data.amount;
      } else {
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Flutterwave webhook
      const data = payload.data || payload;
      reference = data.tx_ref;
      status = data.status === 'successful' ? 'completed' : 'failed';
      amount = data.amount;
    }

    // Log the webhook event
    await supabase.from('payment_gateway_logs').insert({
      gateway_name: gateway,
      event_type: 'webhook_received',
      reference_id: reference,
      amount,
      currency: 'NGN',
      status,
      response_payload: payload,
    });

    // Find the corresponding wallet transaction
    const { data: transaction, error: txError } = await supabase
      .from('wallet_transactions')
      .select('*, profiles!inner(user_id, email)')
      .eq('reference_id', reference)
      .single();

    if (txError || !transaction) {
      console.error('Transaction not found for reference:', reference);
      return new Response(JSON.stringify({ received: true, error: 'Transaction not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update transaction status
    await supabase
      .from('wallet_transactions')
      .update({ status })
      .eq('reference_id', reference);

    if (status === 'completed') {
      // Credit user wallet
      const { error: updateError } = await supabase.rpc('credit_wallet', {
        p_user_id: transaction.user_id,
        p_amount: amount,
      });

      if (updateError) {
        // Fallback: direct update
        await supabase
          .from('profiles')
          .update({ 
            wallet_balance: supabase.raw(`wallet_balance + ${amount}`)
          })
          .eq('user_id', transaction.user_id);
      }

      // Create notification
      await supabase.from('notifications').insert({
        user_id: transaction.user_id,
        title: 'Wallet Funded Successfully',
        message: `Your wallet has been credited with ₦${amount.toLocaleString()}`,
        type: 'wallet',
        icon: 'wallet',
        action_url: '/wallet',
      });

      // Trigger email notification
      await supabase.functions.invoke('send-notification-email', {
        body: {
          user_id: transaction.user_id,
          email_type: 'wallet_funded',
          data: { amount, reference },
        },
      });
    }

    return new Response(JSON.stringify({ success: true, status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
