import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GigCard } from './GigCard';
import { GigFilters } from './GigFilters';
import { toast } from 'sonner';
import { Briefcase, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  description: string;
  campaign_type: string;
  campaign_category?: string;
  platform?: string;
  content_style?: string;
  budget_per_influencer?: number;
  cost_per_video?: number;
  deadline?: string;
  target_cities?: string[];
  influencer_tier?: string;
  max_influencers?: number;
  current_applicants?: number;
  created_at: string;
  requires_physical_product?: boolean;
}

export function GigDiscoveryFeed() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string>('starter');
  const [appliedCampaigns, setAppliedCampaigns] = useState<string[]>([]);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignType, setCampaignType] = useState('all');
  const [tier, setTier] = useState('all');
  const [city, setCity] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const hasActiveFilters = 
    searchTerm !== '' || 
    campaignType !== 'all' || 
    tier !== 'all' || 
    city !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setCampaignType('all');
    setTier('all');
    setCity('all');
    setSortBy('newest');
  };

  const fetchUserTier = useCallback(async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('follower_count, completion_rate')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile) {
      // Determine tier based on follower count
      const followers = profile.follower_count || 0;
      if (followers >= 500000) {
        setUserTier('super');
      } else if (followers >= 100000) {
        setUserTier('top');
      } else if (followers >= 10000) {
        setUserTier('mid');
      } else {
        setUserTier('starter');
      }
    }
  }, [user]);

  const fetchAppliedCampaigns = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('campaign_applications')
      .select('campaign_id')
      .eq('influencer_id', user.id);

    if (data) {
      setAppliedCampaigns(data.map(a => a.campaign_id));
    }
  }, [user]);

  const fetchCampaigns = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .eq('visibility', 'public')
        .neq('creator_id', user.id);

      // Apply filters
      if (campaignType !== 'all') {
        query = query.eq('campaign_type', campaignType);
      }
      if (tier !== 'all') {
        query = query.eq('influencer_tier', tier);
      }
      if (city !== 'all') {
        query = query.contains('target_cities', [city]);
      }

      // Apply sorting
      switch (sortBy) {
        case 'highest_pay':
          query = query.order('cost_per_video', { ascending: false, nullsFirst: false });
          break;
        case 'deadline':
          query = query.order('deadline', { ascending: true, nullsFirst: false });
          break;
        case 'spots':
          query = query.order('max_influencers', { ascending: false, nullsFirst: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      // Filter out already applied campaigns
      const available = (data || []).filter(c => !appliedCampaigns.includes(c.id));
      
      // Apply search filter client-side
      let filtered = available;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = available.filter(c => 
          c.title.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term) ||
          c.campaign_type.toLowerCase().includes(term)
        );
      }

      setCampaigns(filtered);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load gigs');
    } finally {
      setLoading(false);
    }
  }, [user, campaignType, tier, city, sortBy, searchTerm, appliedCampaigns]);

  useEffect(() => {
    if (user) {
      fetchUserTier();
      fetchAppliedCampaigns();
    }
  }, [user, fetchUserTier, fetchAppliedCampaigns]);

  useEffect(() => {
    if (user && appliedCampaigns) {
      fetchCampaigns();
    }
  }, [user, fetchCampaigns, appliedCampaigns]);

  const handleClaimGig = async (campaignId: string) => {
    if (!user) return;

    setClaiming(campaignId);
    try {
      // Get campaign details for proposed rate
      const campaign = campaigns.find(c => c.id === campaignId);
      const proposedRate = campaign?.budget_per_influencer || campaign?.cost_per_video || 5000;

      const { error } = await supabase
        .from('campaign_applications')
        .insert({
          campaign_id: campaignId,
          influencer_id: user.id,
          proposed_rate: proposedRate,
          status: 'pending',
          estimated_reach: 0
        });

      if (error) throw error;

      // Update current_applicants count
      await supabase
        .from('campaigns')
        .update({ 
          current_applicants: (campaign?.current_applicants || 0) + 1 
        })
        .eq('id', campaignId);

      toast.success('Gig claimed! Wait for approval.');
      
      // Update applied campaigns list
      setAppliedCampaigns(prev => [...prev, campaignId]);
      
      // Remove from available list
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    } catch (error: any) {
      console.error('Error claiming gig:', error);
      if (error.code === '23505') {
        toast.error('You already applied to this gig');
      } else {
        toast.error('Failed to claim gig');
      }
    } finally {
      setClaiming(null);
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'super': return 'Super Star';
      case 'top': return 'Top Creator';
      case 'mid': return 'Mid-Tier';
      default: return 'Starter';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Find Gigs
          </h2>
          <p className="text-sm text-muted-foreground">
            Discover campaigns that match your profile
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            {getTierLabel(userTier)}
          </Badge>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              fetchAppliedCampaigns();
              fetchCampaigns();
            }}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <GigFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        campaignType={campaignType}
        onCampaignTypeChange={setCampaignType}
        tier={tier}
        onTierChange={setTier}
        city={city}
        onCityChange={setCity}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-muted-foreground">
          {campaigns.length} gig{campaigns.length !== 1 ? 's' : ''} available
        </p>
      )}

      {/* Gig Cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No gigs found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {hasActiveFilters 
                ? 'Try adjusting your filters to see more gigs'
                : 'Check back later for new opportunities'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <GigCard
              key={campaign.id}
              campaign={campaign}
              onClaim={handleClaimGig}
              loading={claiming === campaign.id}
              userTier={userTier}
            />
          ))}
        </div>
      )}
    </div>
  );
}
