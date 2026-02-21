import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, UserCheck, DollarSign } from 'lucide-react';

interface Props {
  campaignId: string;
  campaignTitle: string;
  onUpdate?: () => void;
}

export function ApplicationApprovalPanel({ campaignId, campaignTitle, onUpdate }: Props) {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [campaignId]);

  const fetchApplications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('campaign_applications')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      // Fetch influencer profiles
      const influencerIds = [...new Set(data.map(a => a.influencer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, follower_count, rating, influencer_tier, completed_campaigns')
        .in('user_id', influencerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setApplications(data.map(a => ({ ...a, profile: profileMap.get(a.influencer_id) })));
    } else {
      setApplications([]);
    }
    setLoading(false);
  };

  const handleAction = async (appId: string, action: 'approved' | 'rejected') => {
    setProcessing(appId);
    const { error } = await supabase
      .from('campaign_applications')
      .update({ status: action, updated_at: new Date().toISOString() })
      .eq('id', appId);

    if (error) {
      toast.error(`Failed to ${action} application`);
    } else {
      toast.success(`Application ${action}!`);
      fetchApplications();
      onUpdate?.();
    }
    setProcessing(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>;
      case 'rejected': return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
      case 'completed': return <Badge className="bg-primary/10 text-primary border-primary/20">Completed</Badge>;
      default: return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
    }
  };

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;

  if (applications.length === 0) {
    return (
      <div className="text-center py-8">
        <UserCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No applications yet</p>
      </div>
    );
  }

  const pending = applications.filter(a => a.status === 'pending');
  const others = applications.filter(a => a.status !== 'pending');

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-warning flex items-center gap-1 mb-3">
            <Clock className="h-4 w-4" /> {pending.length} Pending Approval
          </h4>
          <div className="space-y-3">
            {pending.map(app => (
              <div key={app.id} className="p-3 border rounded-lg border-warning/30 bg-warning/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {app.profile?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{app.profile?.full_name || 'Unknown'}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {app.profile?.username && <span>@{app.profile.username}</span>}
                        <span>{(app.profile?.follower_count || 0).toLocaleString()} followers</span>
                        <span>⭐ {(app.profile?.rating || 0).toFixed(1)}</span>
                        <span>{app.profile?.completed_campaigns || 0} completed</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <DollarSign className="h-3 w-3" />₦{(app.proposed_rate || 0).toLocaleString()}
                  </div>
                </div>
                {app.proposal && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{app.proposal}</p>}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1 flex-1"
                    disabled={processing === app.id}
                    onClick={() => handleAction(app.id, 'approved')}
                  >
                    <CheckCircle className="h-3 w-3" />Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 flex-1 text-destructive"
                    disabled={processing === app.id}
                    onClick={() => handleAction(app.id, 'rejected')}
                  >
                    <XCircle className="h-3 w-3" />Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Previous Applications</h4>
          <div className="space-y-2">
            {others.map(app => (
              <div key={app.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{app.profile?.full_name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{app.profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">₦{(app.proposed_rate || 0).toLocaleString()}</p>
                  </div>
                </div>
                {getStatusBadge(app.status)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
