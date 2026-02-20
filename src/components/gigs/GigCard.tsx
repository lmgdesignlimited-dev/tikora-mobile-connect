import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { CampaignDetailModal } from '@/components/gigs/CampaignDetailModal';
import { Music, Package, Film, Smartphone, Globe, Calendar, Users, MapPin, Zap, Clock, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GigCardProps {
  campaign: {
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
  };
  onClaim: (campaignId: string) => void;
  loading?: boolean;
  userTier?: string;
}

export function GigCard({ campaign, onClaim, loading, userTier }: GigCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  const getCampaignIcon = (type: string) => {
    switch (type) {
      case 'song_promotion': return <Music className="h-5 w-5 text-primary" />;
      case 'product_review': return <Package className="h-5 w-5 text-orange-500" />;
      case 'movie_promotion': return <Film className="h-5 w-5 text-purple-500" />;
      case 'app_promotion': return <Smartphone className="h-5 w-5 text-blue-500" />;
      default: return <Globe className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'music': return 'bg-primary/10 text-primary border-primary/20';
      case 'product': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'entertainment': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'tech': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'super': return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white';
      case 'top': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'mid': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const payment = campaign.budget_per_influencer || campaign.cost_per_video || 0;
  const spotsLeft = (campaign.max_influencers || 10) - (campaign.current_applicants || 0);
  const isUrgent = spotsLeft <= 3;
  const tierMatch = !campaign.influencer_tier ||
    campaign.influencer_tier === 'starter' ||
    campaign.influencer_tier === userTier;

  return (
    <>
      <Card className={`overflow-hidden transition-all hover:shadow-lg ${!tierMatch ? 'opacity-60' : ''}`}>
        {campaign.thumbnail_url && (
          <div className="w-full h-36 bg-muted overflow-hidden">
            <img src={campaign.thumbnail_url} alt={campaign.title} className="w-full h-full object-cover" />
          </div>
        )}

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {getCampaignIcon(campaign.campaign_type)}
              <div>
                <h3 className="font-semibold text-sm line-clamp-1">{campaign.title}</h3>
                <p className="text-xs text-muted-foreground capitalize">{campaign.campaign_type.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <Badge className={getTierBadge(campaign.influencer_tier)}>{campaign.influencer_tier || 'Starter'}</Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{campaign.description}</p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <Badge variant="outline" className={getCategoryColor(campaign.campaign_category)}>{campaign.campaign_category || 'General'}</Badge>
            {campaign.platform && <Badge variant="outline" className="text-xs">{campaign.platform}</Badge>}
            {campaign.content_style && <Badge variant="outline" className="text-xs">{campaign.content_style}</Badge>}
            {campaign.requires_physical_product && (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500">
                <Package className="h-3 w-3 mr-1" />Product
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {campaign.target_cities && campaign.target_cities.length > 0 && (
              <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /><span>{campaign.target_cities.slice(0, 2).join(', ')}</span></div>
            )}
            {campaign.deadline && (
              <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /><span>{new Date(campaign.deadline).toLocaleDateString()}</span></div>
            )}
            <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}</span></div>
          </div>

          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1 text-xs ${isUrgent ? 'text-destructive' : 'text-muted-foreground'}`}>
              <Users className="h-3 w-3" /><span>{spotsLeft} spots left</span>{isUrgent && <Zap className="h-3 w-3" />}
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">₦{payment.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">per video</p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 gap-2">
          <Button variant="outline" className="flex-1 gap-1" onClick={() => setDetailOpen(true)}>
            <BookOpen className="h-4 w-4" /> Read More
          </Button>
          <Button className="flex-1" onClick={() => onClaim(campaign.id)} disabled={loading || !tierMatch || spotsLeft <= 0}>
            {!tierMatch ? 'Tier Mismatch' : spotsLeft <= 0 ? 'Full' : 'Claim Gig'}
          </Button>
        </CardFooter>
      </Card>

      <CampaignDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        campaign={campaign}
        onApply={() => onClaim(campaign.id)}
        tierMatch={tierMatch}
      />
    </>
  );
}
