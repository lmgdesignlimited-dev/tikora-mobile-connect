import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  gateway: 'korapay' | 'flutterwave';
  amount: number;
  email: string;
  reference: string;
  redirect_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { gateway, amount, email, reference, redirect_url } = await req.json() as PaymentRequest;

    // Get gateway configuration
    const { data: config, error: configError } = await supabase
      .from('payment_gateway_config')
      .select('*')
      .eq('gateway_name', gateway)
      .single();

    if (configError || !config) {
      throw new Error(`Gateway ${gateway} not configured`);
    }

    if (!config.is_active || !config.is_configured) {
      throw new Error(`Gateway ${gateway} is not active or configured`);
    }

    let paymentUrl: string;
    let paymentRef: string;

    if (gateway === 'korapay') {
      const koraPaySecretKey = Deno.env.get('KORAPAY_SECRET_KEY');
      if (!koraPaySecretKey) {
        throw new Error('KoraPay secret key not configured');
      }

      const response = await fetch('https://api.korapay.com/merchant/api/v1/charges/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${koraPaySecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'NGN',
          reference,
          customer: { email },
          notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
          redirect_url: redirect_url || `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/wallet`,
        }),
      });

      const result = await response.json();
      
      if (!result.status || result.status !== true) {
        throw new Error(result.message || 'KoraPay initialization failed');
      }

      paymentUrl = result.data.checkout_url;
      paymentRef = result.data.reference;

    } else if (gateway === 'flutterwave') {
      const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
      if (!flutterwaveSecretKey) {
        throw new Error('Flutterwave secret key not configured');
      }

      const response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${flutterwaveSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: reference,
          amount,
          currency: 'NGN',
          redirect_url: redirect_url || `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/wallet`,
          customer: { email },
          customizations: {
            title: 'Tikora Wallet Funding',
            logo: 'https://tikora.app/logo.png',
          },
        }),
      });

      const result = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.message || 'Flutterwave initialization failed');
      }

      paymentUrl = result.data.link;
      paymentRef = reference;
    } else {
      throw new Error('Invalid gateway');
    }

    // Log the payment initialization
    await supabase.from('payment_gateway_logs').insert({
      gateway_name: gateway,
      event_type: 'payment_initialized',
      reference_id: paymentRef,
      amount,
      currency: 'NGN',
      status: 'pending',
      request_payload: { email, reference },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        payment_url: paymentUrl, 
        reference: paymentRef 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
