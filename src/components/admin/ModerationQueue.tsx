import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  RefreshCw,
  Clock,
  User,
  Video,
  AlertTriangle,
  Shield,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface QueueItem {
  submission_id: string;
  video_url: string;
  platform: string;
  status: string;
  submission_date: string;
  campaign_id: string;
  campaign_title: string;
  campaign_type: string;
  influencer_id: string;
  influencer_name: string;
  influencer_username: string;
  resubmission_count: number;
  rejection_reason?: string;
  admin_feedback?: string;
  is_admin_override?: boolean;
}

interface RejectionReason {
  id: string;
  reason: string;
  category: string;
  description: string;
}

export function ModerationQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReasons, setRejectionReasons] = useState<RejectionReason[]>([]);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customFeedback, setCustomFeedback] = useState<string>('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchQueue(activeTab);
    fetchRejectionReasons();
  }, [activeTab]);

  const fetchQueue = async (status: string) => {
    setLoading(true);
    try {
      // For overrides tab, fetch approved submissions that were admin overridden
      if (status === 'overrides') {
        const { data, error } = await supabase
          .from('video_submissions')
          .select(`
            id,
            video_url,
            platform,
            status,
            submission_date,
            rejection_reason,
            admin_feedback,
            is_admin_override,
            campaign_id,
            influencer_id,
            campaigns!inner(title, campaign_type),
            profiles:public_profiles!video_submissions_influencer_id_fkey(full_name, username)
          `)
          .eq('is_admin_override', true)
          .order('submission_date', { ascending: false })
          .limit(50);

        if (error) throw error;

        const mappedData = (data || []).map((item: any) => ({
          submission_id: item.id,
          video_url: item.video_url,
          platform: item.platform,
          status: item.status,
          submission_date: item.submission_date,
          campaign_id: item.campaign_id,
          campaign_title: item.campaigns?.title || 'Unknown',
          campaign_type: item.campaigns?.campaign_type || 'general',
          influencer_id: item.influencer_id,
          influencer_name: item.profiles?.full_name || 'Unknown',
          influencer_username: item.profiles?.username || '',
          resubmission_count: 0,
          rejection_reason: item.rejection_reason,
          admin_feedback: item.admin_feedback,
          is_admin_override: item.is_admin_override
        }));

        setQueue(mappedData);
      } else {
        const { data, error } = await supabase.rpc('get_moderation_queue', {
          p_status: status,
          p_limit: 50
        });

        if (error) throw error;
        setQueue(data || []);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
      toast.error('Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchRejectionReasons = async () => {
    const { data } = await supabase
      .from('rejection_reasons')
      .select('*')
      .eq('is_active', true);
    
    if (data) {
      setRejectionReasons(data);
    }
  };

  const handleReview = async (submissionId: string, action: 'approve' | 'reject') => {
    setProcessing(submissionId);
    try {
      const { data, error } = await supabase.rpc('review_content', {
        p_submission_id: submissionId,
        p_action: action,
        p_rejection_reason_id: action === 'reject' ? selectedReason || null : null,
        p_custom_feedback: customFeedback || null,
        p_is_admin: true
      });

      if (error) throw error;
      
      const result = data as Record<string, unknown>;
      if (!result.success) throw new Error(result.error as string);

      toast.success(`Content ${action}d successfully`);
      
      // Remove from queue
      setQueue(prev => prev.filter(item => item.submission_id !== submissionId));
      
      // Reset form
      setSelectedReason('');
      setCustomFeedback('');
    } catch (error: any) {
      console.error('Error reviewing content:', error);
      toast.error(error.message || 'Failed to review content');
    } finally {
      setProcessing(null);
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'tiktok':
        return 'bg-black text-white';
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Content Moderation</h2>
          <p className="text-sm text-muted-foreground">
            Review and approve/reject submitted content
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchQueue(activeTab)}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected
          </TabsTrigger>
          <TabsTrigger value="overrides" className="gap-2">
            <Shield className="h-4 w-4" />
            Admin Overrides
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : queue.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No {activeTab} submissions</h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'pending' 
                    ? 'All caught up! No content awaiting review.' 
                    : `No ${activeTab} submissions to display.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {queue.map((item) => (
                <Card key={item.submission_id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Video Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{item.campaign_title}</h4>
                            <p className="text-sm text-muted-foreground capitalize">
                              {item.campaign_type.replace('_', ' ')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPlatformColor(item.platform)}>
                              {item.platform}
                            </Badge>
                            {item.resubmission_count > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Resubmission #{item.resubmission_count}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{item.influencer_name}</span>
                            {item.influencer_username && (
                              <span className="text-muted-foreground">
                                @{item.influencer_username}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatDistanceToNow(new Date(item.submission_date), { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          asChild
                        >
                          <a 
                            href={item.video_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Video
                          </a>
                        </Button>
                      </div>

                      {/* Actions for pending */}
                      {activeTab === 'pending' && (
                        <div className="lg:w-80 space-y-3 border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-4">
                          <div className="flex gap-2">
                            <Button
                              className="flex-1 gap-2"
                              onClick={() => handleReview(item.submission_id, 'approve')}
                              disabled={processing === item.submission_id}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                          </div>

                          <Select value={selectedReason} onValueChange={setSelectedReason}>
                            <SelectTrigger>
                              <SelectValue placeholder="Rejection reason" />
                            </SelectTrigger>
                            <SelectContent>
                              {rejectionReasons.map((reason) => (
                                <SelectItem key={reason.id} value={reason.id}>
                                  {reason.reason}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Textarea
                            placeholder="Additional feedback (optional)"
                            value={customFeedback}
                            onChange={(e) => setCustomFeedback(e.target.value)}
                            rows={2}
                          />

                          <Button
                            variant="destructive"
                            className="w-full gap-2"
                            onClick={() => handleReview(item.submission_id, 'reject')}
                            disabled={processing === item.submission_id}
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      )}

                      {/* Admin Override for rejected submissions */}
                      {activeTab === 'rejected' && (
                        <div className="lg:w-64 space-y-3 border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-4">
                          <div className="text-sm text-muted-foreground mb-2">
                            <p className="font-medium text-foreground">Rejection Reason:</p>
                            <p>{item.rejection_reason || 'No reason provided'}</p>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full gap-2 border-primary text-primary hover:bg-primary/10"
                            onClick={() => handleReview(item.submission_id, 'approve')}
                            disabled={processing === item.submission_id}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Override & Approve
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">
                            This will mark as admin override
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Admin Override History */}
      {activeTab === 'overrides' && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Override History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : queue.filter(q => q.is_admin_override).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No admin overrides recorded yet
              </p>
            ) : (
              <div className="space-y-3">
                {queue.filter(q => q.is_admin_override).map((item) => (
                  <div key={item.submission_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{item.campaign_title}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.influencer_name} • Overridden {formatDistanceToNow(new Date(item.submission_date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      Admin Override
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
