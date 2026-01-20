import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  DollarSign,
  Video,
  Camera,
  Lightbulb,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
  Upload,
} from 'lucide-react';

interface ApplyGigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: {
    id: string;
    title: string;
    campaign_type: string;
    budget_per_influencer?: number;
    cost_per_video?: number;
    requires_physical_product?: boolean;
  };
  onSuccess: () => void;
}

export function ApplyGigModal({ open, onOpenChange, campaign, onSuccess }: ApplyGigModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [portfolioLink1, setPortfolioLink1] = useState('');
  const [portfolioLink2, setPortfolioLink2] = useState('');
  const [portfolioVideos, setPortfolioVideos] = useState<string[]>([]);
  const [proposal, setProposal] = useState('');
  const [hasGoodCamera, setHasGoodCamera] = useState(false);
  const [hasGoodLighting, setHasGoodLighting] = useState(false);
  
  const basePrice = campaign.budget_per_influencer || campaign.cost_per_video || 5000;
  const platformFee = 0.20; // 20% platform fee
  const finalPrice = useCustomPrice && customPrice ? Number(customPrice) : basePrice;
  const influencerEarnings = Math.floor(finalPrice * (1 - platformFee));

  const handleApply = async () => {
    if (!user) return;

    // Validation
    if (!hasGoodCamera || !hasGoodLighting) {
      toast.error('You must confirm you have good camera and lighting equipment');
      return;
    }

    const hasPortfolio = portfolioLink1 || portfolioVideos.length > 0;
    if (!hasPortfolio) {
      toast.error('Please provide at least one portfolio sample (link or upload)');
      return;
    }

    if (useCustomPrice && (!customPrice || Number(customPrice) < 1000)) {
      toast.error('Custom price must be at least ₦1,000');
      return;
    }

    setLoading(true);
    try {
      // Combine video URLs and uploaded videos
      const allPortfolioItems = [
        ...([portfolioLink1, portfolioLink2].filter(Boolean)),
        ...portfolioVideos
      ];

      const { error } = await supabase
        .from('campaign_applications')
        .insert({
          campaign_id: campaign.id,
          influencer_id: user.id,
          proposed_rate: finalPrice,
          portfolio_links: allPortfolioItems,
          proposal: proposal || null,
          status: 'pending',
          estimated_reach: 0
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already applied to this gig');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Application submitted! The brand will review your profile.');
      onSuccess();
      onOpenChange(false);
      resetForm();

      toast.success('Application submitted! The brand will review your profile.');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error applying:', error);
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUseCustomPrice(false);
    setCustomPrice('');
    setPortfolioLink1('');
    setPortfolioLink2('');
    setPortfolioVideos([]);
    setProposal('');
    setHasGoodCamera(false);
    setHasGoodLighting(false);
  };

  const hasValidPortfolio = portfolioLink1 || portfolioVideos.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for Gig</DialogTitle>
          <DialogDescription>
            {campaign.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pricing Section */}
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Campaign Rate
              </Label>
              <p className="font-bold text-lg">₦{basePrice.toLocaleString()}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="custom-price" className="text-sm">
                Use custom pricing?
              </Label>
              <Switch
                id="custom-price"
                checked={useCustomPrice}
                onCheckedChange={setUseCustomPrice}
              />
            </div>

            {useCustomPrice && (
              <div className="space-y-2">
                <Label>Your Custom Rate (₦)</Label>
                <Input
                  type="number"
                  placeholder="Enter your rate"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  min={1000}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum ₦1,000. Higher rates may reduce your selection chances.
                </p>
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Platform fee (20%)</span>
                <span className="text-warning">-₦{(finalPrice * platformFee).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span>You'll earn</span>
                <span className="text-success text-lg">₦{influencerEarnings.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Equipment Confirmation */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              You must have proper equipment to participate in campaigns.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="camera" className="flex items-center gap-2 cursor-pointer">
                <Camera className="h-4 w-4" />
                I have a good quality camera
              </Label>
              <Switch
                id="camera"
                checked={hasGoodCamera}
                onCheckedChange={setHasGoodCamera}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="lighting" className="flex items-center gap-2 cursor-pointer">
                <Lightbulb className="h-4 w-4" />
                I have proper lighting setup
              </Label>
              <Switch
                id="lighting"
                checked={hasGoodLighting}
                onCheckedChange={setHasGoodLighting}
              />
            </div>
          </div>

          {/* Portfolio Links & Uploads */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Portfolio Samples (past work)
            </Label>
            
            {/* File Upload */}
            <FileUpload
              bucket="portfolio"
              folder={user?.id || 'anonymous'}
              accept="image/*,video/*"
              maxSize={50}
              multiple
              onUploadComplete={(urls) => setPortfolioVideos(urls)}
              label="Upload videos or screenshots"
              hint="Upload your best video work (max 50MB each)"
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or paste links</span>
              </div>
            </div>

            <Input
              placeholder="https://tiktok.com/@you/video/..."
              value={portfolioLink1}
              onChange={(e) => setPortfolioLink1(e.target.value)}
            />
            <Input
              placeholder="Another video link (optional)"
              value={portfolioLink2}
              onChange={(e) => setPortfolioLink2(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Share links to your best content that shows your video quality
            </p>
          </div>

          {/* Proposal */}
          <div className="space-y-2">
            <Label>Message to Brand (optional)</Label>
            <Textarea
              placeholder="Why should they pick you? Highlight your experience..."
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              rows={3}
            />
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Application Checklist</Label>
            <div className="flex flex-wrap gap-2">
              <Badge variant={hasGoodCamera ? 'default' : 'outline'} className="gap-1">
                {hasGoodCamera ? <CheckCircle className="h-3 w-3" /> : null}
                Camera
              </Badge>
              <Badge variant={hasGoodLighting ? 'default' : 'outline'} className="gap-1">
                {hasGoodLighting ? <CheckCircle className="h-3 w-3" /> : null}
                Lighting
              </Badge>
              <Badge variant={hasValidPortfolio ? 'default' : 'outline'} className="gap-1">
                {hasValidPortfolio ? <CheckCircle className="h-3 w-3" /> : null}
                Portfolio
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={loading || !hasGoodCamera || !hasGoodLighting || !hasValidPortfolio}
            variant="gradient"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
