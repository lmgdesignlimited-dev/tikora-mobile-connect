import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Video, 
  ExternalLink, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RejectionReason {
  id: string;
  category: string;
  reason: string;
  description: string;
}

interface Submission {
  id: string;
  video_url: string;
  platform: string;
  status: string;
  created_at: string;
  resubmission_count: number;
  influencer_id: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

interface ContentReviewPanelProps {
  campaignId: string;
  campaignTitle: string;
  isAdmin?: boolean;
  onReviewComplete?: () => void;
}

export function ContentReviewPanel({ 
  campaignId, 
  campaignTitle,
  isAdmin = false,
  onReviewComplete 
}: ContentReviewPanelProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<RejectionReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customFeedback, setCustomFeedback] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSubmissions();
    fetchRejectionReasons();
  }, [campaignId]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('video_submissions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately for each submission
      const submissionsWithProfiles = await Promise.all(
        (data || []).map(async (sub) => {
          const { data: profileData } = await supabase
            .from('public_profiles')
            .select('full_name, username, avatar_url')
            .eq('user_id', sub.influencer_id)
            .maybeSingle();
          return { ...sub, profiles: profileData };
        })
      );
      setSubmissions(submissionsWithProfiles as Submission[]);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRejectionReasons = async () => {
    try {
      const { data, error } = await supabase
        .from('rejection_reasons')
        .select('*')
        .eq('is_active', true)
        .order('category');

      if (error) throw error;
      setRejectionReasons(data || []);
    } catch (error) {
      console.error('Error fetching rejection reasons:', error);
    }
  };

  const handleReview = async (submissionId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !selectedReason) {
      toast.error('Please select a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('review_content', {
        p_submission_id: submissionId,
        p_action: action,
        p_rejection_reason_id: action === 'reject' ? selectedReason : null,
        p_custom_feedback: customFeedback || null,
        p_is_admin: isAdmin
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; action?: string };
      if (result.success) {
        toast.success(`Content ${action}d successfully!`);
        setReviewingId(null);
        setSelectedReason('');
        setCustomFeedback('');
        fetchSubmissions();
        onReviewComplete?.();
      } else {
        toast.error(result.error || 'Review failed');
      }
    } catch (error) {
      console.error('Review error:', error);
      toast.error('Failed to process review');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
      case 'resubmitted':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Resubmitted</Badge>;
      default:
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
    }
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const reviewedSubmissions = submissions.filter(s => s.status !== 'pending');

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Reviews */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Pending Reviews
            </CardTitle>
            <Badge variant="outline">{pendingSubmissions.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {pendingSubmissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No submissions pending review
            </p>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.map((submission) => (
                <div 
                  key={submission.id} 
                  className="border rounded-lg p-4 space-y-3"
                >
                  {/* Submission Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {submission.profiles?.full_name || 'Unknown Creator'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{submission.profiles?.username || 'unknown'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {submission.platform}
                    </Badge>
                  </div>

                  {/* Video Link */}
                  <a 
                    href={submission.video_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline text-sm"
                  >
                    <Video className="h-4 w-4" />
                    <span className="truncate">{submission.video_url}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  {/* Resubmission indicator */}
                  {submission.resubmission_count > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span>Resubmission #{submission.resubmission_count}</span>
                    </div>
                  )}

                  {/* Review Actions */}
                  {reviewingId === submission.id ? (
                    <div className="space-y-3 pt-3 border-t">
                      <Select 
                        value={selectedReason} 
                        onValueChange={setSelectedReason}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rejection reason..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(
                            rejectionReasons.reduce((acc, r) => {
                              if (!acc[r.category]) acc[r.category] = [];
                              acc[r.category].push(r);
                              return acc;
                            }, {} as Record<string, RejectionReason[]>)
                          ).map(([category, reasons]) => (
                            <div key={category}>
                              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                                {category}
                              </p>
                              {reasons.map((reason) => (
                                <SelectItem key={reason.id} value={reason.id}>
                                  {reason.reason}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>

                      <Textarea
                        placeholder="Additional feedback (optional)..."
                        value={customFeedback}
                        onChange={(e) => setCustomFeedback(e.target.value)}
                        rows={2}
                      />

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReview(submission.id, 'reject')}
                          disabled={processing || !selectedReason}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Confirm Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setReviewingId(null);
                            setSelectedReason('');
                            setCustomFeedback('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        size="sm"
                        className="bg-success hover:bg-success/90"
                        onClick={() => handleReview(submission.id, 'approve')}
                        disabled={processing}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive hover:bg-destructive/10"
                        onClick={() => setReviewingId(submission.id)}
                        disabled={processing}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviewed Submissions */}
      {reviewedSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
              Reviewed Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviewedSubmissions.map((submission) => (
                <div 
                  key={submission.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {submission.profiles?.full_name || 'Unknown'}
                      </p>
                      <a 
                        href={submission.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary"
                      >
                        View video
                      </a>
                    </div>
                  </div>
                  {getStatusBadge(submission.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Override Section */}
      {isAdmin && reviewedSubmissions.filter(s => s.status === 'rejected').length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <AlertTriangle className="h-5 w-5" />
              Admin Override Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              As an admin, you can override rejected submissions and approve them.
            </p>
            <div className="space-y-2">
              {reviewedSubmissions
                .filter(s => s.status === 'rejected')
                .map((submission) => (
                  <div 
                    key={submission.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <span className="text-sm">
                      {submission.profiles?.full_name}'s submission
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReview(submission.id, 'approve')}
                      disabled={processing}
                    >
                      Override & Approve
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
