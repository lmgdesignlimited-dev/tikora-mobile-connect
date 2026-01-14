import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  user_id: string;
  email_type: 'wallet_funded' | 'wallet_withdrawal' | 'campaign_update' | 'content_approved' | 'content_rejected' | 'application_accepted' | 'application_rejected';
  data: Record<string, any>;
  recipient_email?: string;
}

const emailTemplates: Record<string, { subject: string; template: (data: any) => string }> = {
  wallet_funded: {
    subject: 'Wallet Funded Successfully - Tikora',
    template: (data) => `
      <h2>Your Wallet Has Been Credited!</h2>
      <p>Your Tikora wallet has been successfully funded with <strong>₦${data.amount?.toLocaleString()}</strong>.</p>
      <p>Reference: ${data.reference}</p>
      <p>You can now use these funds to create campaigns or access premium features.</p>
      <a href="https://tikora.app/wallet" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">View Wallet</a>
    `,
  },
  wallet_withdrawal: {
    subject: 'Withdrawal Request Processed - Tikora',
    template: (data) => `
      <h2>Withdrawal ${data.status === 'completed' ? 'Completed' : 'Update'}</h2>
      <p>Your withdrawal request for <strong>₦${data.amount?.toLocaleString()}</strong> has been ${data.status}.</p>
      ${data.status === 'completed' ? '<p>The funds have been sent to your bank account.</p>' : ''}
      <a href="https://tikora.app/wallet" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">View Wallet</a>
    `,
  },
  campaign_update: {
    subject: 'Campaign Update - Tikora',
    template: (data) => `
      <h2>Campaign Update: ${data.campaign_title}</h2>
      <p>${data.message}</p>
      <a href="https://tikora.app/dashboard" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">View Campaign</a>
    `,
  },
  content_approved: {
    subject: '🎉 Your Content Has Been Approved! - Tikora',
    template: (data) => `
      <h2>Congratulations!</h2>
      <p>Your submitted content for <strong>${data.campaign_title}</strong> has been approved!</p>
      <p>Earnings: <strong>₦${data.earnings?.toLocaleString()}</strong></p>
      <p>The funds have been credited to your wallet.</p>
      <a href="https://tikora.app/wallet" style="display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 6px;">View Earnings</a>
    `,
  },
  content_rejected: {
    subject: 'Content Review Update - Tikora',
    template: (data) => `
      <h2>Content Needs Revision</h2>
      <p>Your submitted content for <strong>${data.campaign_title}</strong> requires some changes.</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      ${data.feedback ? `<p><strong>Feedback:</strong> ${data.feedback}</p>` : ''}
      ${data.can_resubmit ? '<p>You can resubmit your content after making the necessary changes.</p>' : '<p>Unfortunately, you have reached the maximum resubmission limit.</p>'}
      <a href="https://tikora.app/activity" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">View Details</a>
    `,
  },
  application_accepted: {
    subject: '🎉 Application Accepted! - Tikora',
    template: (data) => `
      <h2>You're In!</h2>
      <p>Your application for <strong>${data.campaign_title}</strong> has been accepted!</p>
      <p>You can now start creating content for this campaign.</p>
      <a href="https://tikora.app/activity" style="display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 6px;">Get Started</a>
    `,
  },
  application_rejected: {
    subject: 'Application Update - Tikora',
    template: (data) => `
      <h2>Application Update</h2>
      <p>Unfortunately, your application for <strong>${data.campaign_title}</strong> was not selected this time.</p>
      <p>Don't worry - there are plenty of other opportunities waiting for you!</p>
      <a href="https://tikora.app/explore" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">Find More Campaigns</a>
    `,
  },
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

    const { user_id, email_type, data, recipient_email } = await req.json() as EmailRequest;

    // Get user email if not provided
    let email = recipient_email;
    if (!email && user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', user_id)
        .single();
      email = profile?.email;
    }

    if (!email) {
      throw new Error('No recipient email found');
    }

    const template = emailTemplates[email_type];
    if (!template) {
      throw new Error(`Unknown email type: ${email_type}`);
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            h2 { color: #1a1a2e; }
            a { text-decoration: none; }
          </style>
        </head>
        <body>
          ${template.template(data)}
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #888; font-size: 12px;">
            This email was sent by Tikora. If you didn't expect this email, please ignore it.
          </p>
        </body>
      </html>
    `;

    // For now, log the email (integrate with actual email service like Resend, SendGrid, etc.)
    // When email service is configured, replace this with actual send logic
    console.log('Would send email:', { to: email, subject: template.subject, html: htmlContent });

    // Log the email notification
    await supabase.from('email_notifications').insert({
      user_id,
      email_type,
      recipient_email: email,
      subject: template.subject,
      status: 'sent', // Change to 'pending' when using actual email service
      sent_at: new Date().toISOString(),
      metadata: data,
    });

    // Note: To actually send emails, you need to configure an email service
    // Example with Resend:
    // const resendApiKey = Deno.env.get('RESEND_API_KEY');
    // if (resendApiKey) {
    //   const response = await fetch('https://api.resend.com/emails', {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${resendApiKey}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       from: 'Tikora <noreply@tikora.app>',
    //       to: email,
    //       subject: template.subject,
    //       html: htmlContent,
    //     }),
    //   });
    // }

    return new Response(
      JSON.stringify({ success: true, message: 'Email notification processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Email notification error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
