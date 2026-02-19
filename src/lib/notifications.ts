import { supabase } from '@/integrations/supabase/client';

interface NotifyParams {
  userId: string;
  title: string;
  message: string;
  type: 'campaign' | 'application' | 'submission' | 'content' | 'payment' | 'wallet' | 'alert' | 'info';
  actionUrl?: string;
  icon?: string;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Create an in-app notification for a user.
 */
export async function createNotification(params: NotifyParams) {
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    title: params.title,
    message: params.message,
    type: params.type,
    action_url: params.actionUrl,
    icon: params.icon,
    priority: params.priority ?? 'normal',
  });

  if (error) {
    console.error('Failed to create notification:', error);
  }
}

/**
 * Send an email notification via the edge function.
 */
export async function sendEmailNotification(
  userId: string,
  emailType: string,
  data: Record<string, any>
) {
  try {
    await supabase.functions.invoke('send-notification-email', {
      body: { user_id: userId, email_type: emailType, data },
    });
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
}

// ── Pre-built notification helpers ──

export async function notifyNewApplication(
  campaignOwnerId: string,
  influencerName: string,
  campaignTitle: string
) {
  await createNotification({
    userId: campaignOwnerId,
    title: 'New Campaign Application',
    message: `${influencerName} applied to "${campaignTitle}"`,
    type: 'application',
    actionUrl: '/dashboard',
    icon: 'user-plus',
    priority: 'high',
  });
  await sendEmailNotification(campaignOwnerId, 'new_application', {
    influencer_name: influencerName,
    campaign_title: campaignTitle,
  });
}

export async function notifyApplicationDecision(
  influencerId: string,
  campaignTitle: string,
  accepted: boolean
) {
  await createNotification({
    userId: influencerId,
    title: accepted ? 'Application Accepted!' : 'Application Not Selected',
    message: accepted
      ? `You've been accepted for "${campaignTitle}". Start creating!`
      : `Your application for "${campaignTitle}" was not selected.`,
    type: 'application',
    actionUrl: accepted ? '/activity' : '/explore',
    icon: accepted ? 'check-circle' : 'x-circle',
    priority: accepted ? 'high' : 'normal',
  });
  await sendEmailNotification(
    influencerId,
    accepted ? 'application_accepted' : 'application_rejected',
    { campaign_title: campaignTitle }
  );
}

export async function notifyContentReview(
  influencerId: string,
  campaignTitle: string,
  approved: boolean,
  earnings?: number,
  reason?: string,
  canResubmit?: boolean
) {
  if (approved) {
    await createNotification({
      userId: influencerId,
      title: 'Content Approved!',
      message: `Your video for "${campaignTitle}" was approved. ₦${earnings?.toLocaleString()} credited.`,
      type: 'content',
      actionUrl: '/wallet',
      icon: 'check-circle',
      priority: 'high',
    });
    await sendEmailNotification(influencerId, 'content_approved', {
      campaign_title: campaignTitle,
      earnings,
    });
  } else {
    await createNotification({
      userId: influencerId,
      title: 'Content Needs Revision',
      message: `Your video for "${campaignTitle}" was not approved. ${canResubmit ? 'You can resubmit.' : ''}`,
      type: 'content',
      actionUrl: '/activity',
      icon: 'alert-circle',
      priority: 'high',
    });
    await sendEmailNotification(influencerId, 'content_rejected', {
      campaign_title: campaignTitle,
      reason,
      can_resubmit: canResubmit,
    });
  }
}

export async function notifyWalletFunded(
  userId: string,
  amount: number,
  reference: string
) {
  await createNotification({
    userId,
    title: 'Wallet Funded',
    message: `₦${amount.toLocaleString()} has been added to your wallet.`,
    type: 'wallet',
    actionUrl: '/wallet',
    icon: 'wallet',
  });
  await sendEmailNotification(userId, 'wallet_funded', { amount, reference });
}

export async function notifyWithdrawalUpdate(
  userId: string,
  amount: number,
  status: 'completed' | 'rejected'
) {
  await createNotification({
    userId,
    title: status === 'completed' ? 'Withdrawal Successful' : 'Withdrawal Rejected',
    message:
      status === 'completed'
        ? `₦${amount.toLocaleString()} has been sent to your bank account.`
        : `Your withdrawal of ₦${amount.toLocaleString()} was rejected.`,
    type: 'wallet',
    actionUrl: '/wallet',
    icon: 'wallet',
    priority: 'high',
  });
  await sendEmailNotification(userId, 'wallet_withdrawal', { amount, status });
}
