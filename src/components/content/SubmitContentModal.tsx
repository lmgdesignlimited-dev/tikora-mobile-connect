import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Video, Upload, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SubmitContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignTitle: string;
  defaultPlatform?: string;
  onSuccess?: () => void;
}

export function SubmitContentModal({
  open,
  onOpenChange,
  campaignId,
  campaignTitle,
  defaultPlatform = 'tiktok',
  onSuccess
}: SubmitContentModalProps) {
  const { user } = useAuth();
  const [videoUrl, setVideoUrl] = useState('');
  const [platform, setPlatform] = useState(defaultPlatform);
  const [loading, setLoading] = useState(false);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      // Check for common video platforms
      const validDomains = [
        'tiktok.com', 'vm.tiktok.com',
        'instagram.com',
        'youtube.com', 'youtu.be',
        'twitter.com', 'x.com'
      ];
      return validDomains.some(domain => url.includes(domain));
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!videoUrl.trim()) {
      toast.error('Please enter a video URL');
      return;
    }

    if (!validateUrl(videoUrl)) {
      toast.error('Please enter a valid video URL from TikTok, Instagram, or YouTube');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('video_submissions')
        .insert({
          campaign_id: campaignId,
          influencer_id: user?.id,
          video_url: videoUrl.trim(),
          platform,
          status: 'pending'
        });

      if (error) throw error;

      // Update campaign submitted count
      try {
        await supabase
          .from('campaigns')
          .update({ videos_submitted: supabase.rpc('increment_counter' as never) as never })
          .eq('id', campaignId);
      } catch {
        // Silently handle if update fails
      }

      toast.success('Content submitted for review!');
      setVideoUrl('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Submit Content
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium">Campaign</p>
            <p className="text-sm text-muted-foreground">{campaignTitle}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="twitter">Twitter/X</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="videoUrl"
                placeholder="https://www.tiktok.com/@user/video/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Paste the link to your published video
            </p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-sm font-medium text-primary">Before submitting:</p>
            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
              <li>• Make sure your video is public</li>
              <li>• Use the correct sound/song if required</li>
              <li>• Include all required hashtags</li>
              <li>• Follow the campaign brief</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading || !videoUrl.trim()}
            >
              {loading ? (
                'Submitting...'
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit for Review
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
