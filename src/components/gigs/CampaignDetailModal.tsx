import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Music,
  Package,
  Film,
  Smartphone,
  Globe,
  Calendar,
  Users,
  MapPin,
  DollarSign,
  Hash,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Campaign {
  id: string;
  title: string;
  description: string;
  campaign_type: string;
  campaign_category?: string;
  platform?: string;
  content_style?: string;
  content_guidelines?: string;
  requirements?: string;
  budget_per_influencer?: number;
  cost_per_video?: number;
  deadline?: string;
  target_cities?: string[];
  influencer_tier?: string;
  max_influencers?: number;
  current_applicants?: number;
  created_at: string;
  requires_physical_product?: boolean;
  hashtags?: string[];
  song_url?: string;
  thumbnail_url?: string;
}

interface CampaignDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
  onApply?: () => void;
  tierMatch?: boolean;
}

export function CampaignDetailModal({ open, onOpenChange, campaign, onApply, tierMatch }: CampaignDetailModalProps) {
  if (!campaign) return null;

  const getCampaignIcon = (type: string) => {
    switch (type) {
      case 'song_promotion': return <Music className="h-5 w-5 text-primary" />;
      case 'product_review': return <Package className="h-5 w-5 text-orange-500" />;
      case 'movie_promotion': return <Film className="h-5 w-5 text-purple-500" />;
      case 'app_promotion': return <Smartphone className="h-5 w-5 text-blue-500" />;
      default: return <Globe className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const payment = campaign.budget_per_influencer || campaign.cost_per_video || 0;
  const spotsLeft = (campaign.max_influencers || 10) - (campaign.current_applicants || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getCampaignIcon(campaign.campaign_type)}
            {campaign.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Thumbnail */}
          {campaign.thumbnail_url && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
              <img src={campaign.thumbnail_url} alt={campaign.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize">{campaign.campaign_type?.replace(/_/g, ' ')}</Badge>
            {campaign.platform && <Badge variant="outline">{campaign.platform}</Badge>}
            {campaign.content_style && <Badge variant="outline">{campaign.content_style}</Badge>}
            {campaign.influencer_tier && <Badge variant="secondary">{campaign.influencer_tier} tier</Badge>}
            {campaign.requires_physical_product && (
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                <Package className="h-3 w-3 mr-1" /> Physical Product
              </Badge>
            )}
          </div>

          {/* Payment & spots */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-3xl font-bold text-primary">₦{payment.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">per video</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{spotsLeft} spots left</p>
              <p className="text-sm text-muted-foreground">out of {campaign.max_influencers || 10}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> Description
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{campaign.description}</p>
          </div>

          {/* Requirements */}
          {campaign.requirements && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-semibold mb-2">Requirements</p>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{campaign.requirements}</p>
              </div>
            </>
          )}

          {/* Content Guidelines */}
          {campaign.content_guidelines && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-semibold mb-2">Content Guidelines</p>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{campaign.content_guidelines}</p>
              </div>
            </>
          )}

          {/* Details grid */}
          <Separator />
          <div className="grid grid-cols-2 gap-3 text-sm">
            {campaign.deadline && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Deadline: {new Date(campaign.deadline).toLocaleDateString()}</span>
              </div>
            )}
            {campaign.target_cities && campaign.target_cities.length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{campaign.target_cities.join(', ')}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{campaign.current_applicants || 0} applied</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Posted {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}</span>
            </div>
          </div>

          {/* Hashtags */}
          {campaign.hashtags && campaign.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {campaign.hashtags.map(tag => (
                <Badge key={tag} variant="outline" className="text-primary">
                  <Hash className="h-3 w-3 mr-0.5" />{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Song URL */}
          {campaign.song_url && (
            <a href={campaign.song_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
              <LinkIcon className="h-4 w-4" /> Listen to the Song
            </a>
          )}

          {/* Apply Button */}
          {onApply && (
            <Button
              className="w-full"
              size="lg"
              onClick={() => { onOpenChange(false); onApply(); }}
              disabled={!tierMatch || spotsLeft <= 0}
            >
              {!tierMatch ? 'Tier Requirement Not Met' : spotsLeft <= 0 ? 'Fully Booked' : 'Apply for This Gig'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
