import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Video, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoSubmissionCardProps {
  submission: {
    id: string;
    video_url: string;
    platform: string;
    status: string;
    rejection_reason?: string;
    rejection_category?: string;
    admin_feedback?: string;
    resubmission_count: number;
    max_resubmissions: number;
    created_at: string;
    reviewed_at?: string;
    campaigns?: {
      title: string;
      campaign_type: string;
    };
  };
  onRefresh?: () => void;
  showResubmit?: boolean;
}

export function VideoSubmissionCard({ 
  submission, 
  onRefresh,
  showResubmit = true 
}: VideoSubmissionCardProps) {
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const canResubmit = submission.status === 'rejected' && 
    submission.resubmission_count < submission.max_resubmissions;

  const handleResubmit = async () => {
    if (!newVideoUrl.trim()) {
      toast.error('Please enter a valid video URL');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('resubmit_content', {
        p_original_submission_id: submission.id,
        p_new_video_url: newVideoUrl.trim()
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (result.success) {
        toast.success('Content resubmitted successfully!');
        setIsResubmitting(false);
        setNewVideoUrl('');
        onRefresh?.();
      } else {
        toast.error(result.error || 'Failed to resubmit');
      }
    } catch (error) {
      console.error('Resubmit error:', error);
      toast.error('Failed to resubmit content');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (submission.status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'resubmitted':
        return <RefreshCw className="h-5 w-5 text-primary" />;
      default:
        return <Clock className="h-5 w-5 text-warning" />;
    }
  };

  const getStatusBadgeClass = () => {
    switch (submission.status) {
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'resubmitted':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">
              {submission.campaigns?.title || 'Video Submission'}
            </CardTitle>
          </div>
          <Badge className={getStatusBadgeClass()}>
            {getStatusIcon()}
            <span className="ml-1 capitalize">{submission.status}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Video Link */}
        <div className="flex items-center gap-2">
          <a 
            href={submission.video_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
          >
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{submission.video_url}</span>
          </a>
        </div>

        {/* Platform & Date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Badge variant="outline" className="capitalize">
            {submission.platform}
          </Badge>
          <span>{new Date(submission.created_at).toLocaleDateString()}</span>
        </div>

        {/* Rejection Info */}
        {submission.status === 'rejected' && submission.rejection_reason && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  Rejection Reason
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {submission.rejection_reason}
                </p>
                {submission.admin_feedback && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    "{submission.admin_feedback}"
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resubmission Info */}
        {submission.resubmission_count > 0 && (
          <p className="text-xs text-muted-foreground">
            Resubmission {submission.resubmission_count} of {submission.max_resubmissions}
          </p>
        )}

        {/* Resubmit Action */}
        {showResubmit && canResubmit && (
          <div className="pt-2 border-t">
            {isResubmitting ? (
              <div className="space-y-2">
                <Input
                  placeholder="Enter new video URL..."
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleResubmit}
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => {
                      setIsResubmitting(false);
                      setNewVideoUrl('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => setIsResubmitting(true)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Resubmit ({submission.max_resubmissions - submission.resubmission_count} remaining)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
