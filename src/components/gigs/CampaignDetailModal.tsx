import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
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
  Image,
  Video,
  Star,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Camera,
  Sparkles,
  Eye,
  Shield,
  Clock,
  Target,
  Megaphone,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AdsPromotionSection } from './AdsPromotionSection';

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
  requires_physical_coverage?: boolean;
  hashtags?: string[];
  song_url?: string;
  thumbnail_url?: string;
  // Extended fields
  target_audience?: string;
  video_quality?: string;
  movie_title?: string;
  trailer_url?: string;
  streaming_link?: string;
  app_name?: string;
  app_store_url?: string;
  website_url?: string;
  event_date?: string;
  event_location?: string;
  production_package?: string;
  production_location?: string;
  campaign_subtype?: string;
  product_details?: any;
  target_demographics?: any;
  videos_requested?: number;
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
  const productDetails = campaign.product_details && typeof campaign.product_details === 'object' ? campaign.product_details : null;
  const demographics = campaign.target_demographics && typeof campaign.target_demographics === 'object' ? campaign.target_demographics : null;

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
          {/* ── Thumbnail / Art Cover ── */}
          {campaign.thumbnail_url && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
              <img src={campaign.thumbnail_url} alt={campaign.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2">
                <Badge className="bg-background/80 backdrop-blur text-foreground gap-1">
                  <Image className="h-3 w-3" /> Campaign Visual
                </Badge>
              </div>
            </div>
          )}

          {/* ── Badges row ── */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize">{campaign.campaign_type?.replace(/_/g, ' ')}</Badge>
            {campaign.platform && <Badge variant="outline">{campaign.platform}</Badge>}
            {campaign.content_style && <Badge variant="outline">{campaign.content_style}</Badge>}
            {campaign.influencer_tier && <Badge variant="secondary">{campaign.influencer_tier} tier</Badge>}
            {campaign.campaign_subtype && campaign.campaign_subtype !== 'standard' && (
              <Badge variant="outline" className="capitalize">{campaign.campaign_subtype}</Badge>
            )}
            {campaign.video_quality && campaign.video_quality !== 'standard' && (
              <Badge variant="outline">Quality: {campaign.video_quality}</Badge>
            )}
            {campaign.requires_physical_product && (
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                <Package className="h-3 w-3 mr-1" /> Physical Product
              </Badge>
            )}
            {campaign.requires_physical_coverage && (
              <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                <Camera className="h-3 w-3 mr-1" /> Physical Coverage
              </Badge>
            )}
          </div>

          {/* ── Payment & Spots ── */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-3xl font-bold text-primary">₦{payment.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">per video</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{spotsLeft} spots left</p>
              <p className="text-sm text-muted-foreground">out of {campaign.max_influencers || 10}</p>
              {campaign.videos_requested && campaign.videos_requested > 1 && (
                <p className="text-xs text-muted-foreground mt-1">{campaign.videos_requested} videos requested</p>
              )}
            </div>
          </div>

          {/* ── Full Description ── */}
          <DetailSection icon={FileText} title="Campaign Description">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{campaign.description}</p>
          </DetailSection>

          {/* ── Requirements ── */}
          {campaign.requirements && (
            <DetailSection icon={Shield} title="Requirements (Must Read)">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{campaign.requirements}</p>
            </DetailSection>
          )}

          {/* ── Content Guidelines ── */}
          {campaign.content_guidelines && (
            <DetailSection icon={Eye} title="Content Guidelines (Must Follow)">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{campaign.content_guidelines}</p>
            </DetailSection>
          )}

          {/* ── Target Audience ── */}
          {campaign.target_audience && (
            <DetailSection icon={Target} title="Target Audience">
              <p className="text-sm text-muted-foreground">{campaign.target_audience}</p>
            </DetailSection>
          )}

          {/* ── Demographics ── */}
          {demographics && Object.keys(demographics).length > 0 && (
            <DetailSection icon={Users} title="Target Demographics">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(demographics).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-2 bg-background rounded">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}

          {/* ── Product Details (for product reviews) ── */}
          {productDetails && Object.keys(productDetails).length > 0 && (
            <DetailSection icon={Package} title="Product Details">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(productDetails).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-2 bg-background rounded">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}

          {/* ── Song / Music Details ── */}
          {campaign.campaign_type === 'song_promotion' && campaign.song_url && (
            <DetailSection icon={Music} title="Song / Sound">
              <a href={campaign.song_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <LinkIcon className="h-4 w-4" /> Listen to the Song / Sound
              </a>
              <p className="text-xs text-muted-foreground mt-1">You must use this exact sound in your video</p>
            </DetailSection>
          )}

          {/* ── Movie Details ── */}
          {campaign.campaign_type === 'movie_promotion' && (
            <DetailSection icon={Film} title="Movie / Film Details">
              <div className="space-y-2 text-sm">
                {campaign.movie_title && <p><span className="text-muted-foreground">Title:</span> <span className="font-medium">{campaign.movie_title}</span></p>}
                {campaign.trailer_url && (
                  <a href={campaign.trailer_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                    <Video className="h-4 w-4" /> Watch Trailer
                  </a>
                )}
                {campaign.streaming_link && (
                  <a href={campaign.streaming_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                    <LinkIcon className="h-4 w-4" /> Streaming Link
                  </a>
                )}
              </div>
            </DetailSection>
          )}

          {/* ── App Details ── */}
          {campaign.campaign_type === 'app_promotion' && (
            <DetailSection icon={Smartphone} title="App Details">
              <div className="space-y-2 text-sm">
                {campaign.app_name && <p><span className="text-muted-foreground">App Name:</span> <span className="font-medium">{campaign.app_name}</span></p>}
                {campaign.app_store_url && (
                  <a href={campaign.app_store_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                    <LinkIcon className="h-4 w-4" /> App Store / Play Store Link
                  </a>
                )}
                {campaign.website_url && (
                  <a href={campaign.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                    <Globe className="h-4 w-4" /> Website
                  </a>
                )}
              </div>
            </DetailSection>
          )}

          {/* ── Event / Physical Coverage ── */}
          {(campaign.event_date || campaign.event_location || campaign.production_location) && (
            <DetailSection icon={MapPin} title="Event / Location Details">
              <div className="space-y-1 text-sm">
                {campaign.event_date && <p><span className="text-muted-foreground">Event Date:</span> <span className="font-medium">{new Date(campaign.event_date).toLocaleDateString()}</span></p>}
                {campaign.event_location && <p><span className="text-muted-foreground">Location:</span> <span className="font-medium">{campaign.event_location}</span></p>}
                {campaign.production_location && <p><span className="text-muted-foreground">Shoot Location:</span> <span className="font-medium">{campaign.production_location}</span></p>}
                {campaign.production_package && <p><span className="text-muted-foreground">Production Package:</span> <span className="font-medium">{campaign.production_package}</span></p>}
              </div>
            </DetailSection>
          )}

          {/* ── Website Link ── */}
          {campaign.website_url && campaign.campaign_type !== 'app_promotion' && (
            <a href={campaign.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
              <Globe className="h-4 w-4" /> Visit Website
            </a>
          )}

          {/* ── Details Grid ── */}
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
              <Clock className="h-4 w-4" />
              <span>Posted {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}</span>
            </div>
          </div>

          {/* ── Hashtags ── */}
          {campaign.hashtags && campaign.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {campaign.hashtags.map(tag => (
                <Badge key={tag} variant="outline" className="text-primary">
                  <Hash className="h-3 w-3 mr-0.5" />{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* ═══════ Ads Promotion Section ═══════ */}
          {payment > 0 && (
            <>
              <Separator />
              <AdsPromotionSection
                adBudget={Math.round(payment * 2)}
                basePayment={payment}
                platform={campaign.platform || 'TikTok'}
              />
            </>
          )}

          {/* ═══════ Quality Video Guide ═══════ */}
          <Separator />
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                Quality Video Guide — Improve Your Rating & Avoid Rejection
              </h3>

              <div className="space-y-2">
                <GuideItem icon={Camera} title="Lighting & Camera">
                  Use natural daylight or a ring light. Shoot in 1080p or higher. Avoid dark, grainy, or shaky footage.
                </GuideItem>
                <GuideItem icon={Video} title="Audio Quality">
                  Use the original campaign sound at a clear volume. Avoid background noise, echoes, or muffled audio. Use a mic if possible.
                </GuideItem>
                <GuideItem icon={Eye} title="Follow the Brief Exactly">
                  Read every requirement and guideline above. Include all required hashtags, mentions, and sounds. Missing any item will result in rejection.
                </GuideItem>
                <GuideItem icon={Star} title="Engage & Be Authentic">
                  Show genuine emotion and energy. Brands prefer creators who are enthusiastic and relatable, not robotic.
                </GuideItem>
                <GuideItem icon={Clock} title="Submit On Time">
                  Late submissions may be automatically rejected. Aim to submit at least 24 hours before the deadline.
                </GuideItem>
                <GuideItem icon={Megaphone} title="Platform Best Practices">
                  Use trending formats on {campaign.platform || 'TikTok'}. Hook viewers in the first 2 seconds. Keep videos between 15–60 seconds unless told otherwise.
                </GuideItem>
              </div>

              <Alert className="bg-destructive/10 border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-xs">
                  <strong>Common Rejection Reasons:</strong> Wrong sound used, poor lighting, missing hashtags, video too short/long, watermarked content, or not following the brief. Read all instructions carefully before recording.
                </AlertDescription>
              </Alert>

              <Alert className="bg-success/10 border-success/20">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription className="text-xs">
                  <strong>Pro Tip:</strong> Creators with 90%+ approval rates get priority for higher-paying gigs and earn the "Trusted Creator" badge.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* ── Apply Button ── */}
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

/* ── Helper sub-components ── */

function DetailSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <>
      <Separator />
      <div>
        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <Icon className="h-4 w-4" /> {title}
        </p>
        {children}
      </div>
    </>
  );
}

function GuideItem({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-2 rounded-md bg-background/60">
      <Icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
      <div>
        <p className="text-xs font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
