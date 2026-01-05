import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Star, 
  TrendingUp, 
  MapPin,
  Filter,
  Search,
  Zap,
  CheckCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface RankedInfluencer {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  rating: number;
  completion_rate: number;
  follower_count: number;
  is_boosted: boolean;
  boost_expires_at: string | null;
  ranking_score: number;
  boost_type: string | null;
}

interface InfluencerSelectionProps {
  campaignId?: string;
  onSelect?: (influencerId: string) => void;
  selectedInfluencers?: string[];
}

export function InfluencerSelection({ 
  campaignId, 
  onSelect,
  selectedInfluencers = []
}: InfluencerSelectionProps) {
  const { user } = useAuth();
  const [influencers, setInfluencers] = useState<RankedInfluencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'boosted' | 'top_rated'>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  useEffect(() => {
    loadInfluencers();
  }, [filterType, cityFilter]);

  const loadInfluencers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_ranked_influencers', {
        p_campaign_id: campaignId || null,
        p_city: cityFilter === 'all' ? null : cityFilter,
        p_tier: null,
        p_limit: 50
      });

      if (error) throw error;
      
      let filteredData = data || [];
      
      // Apply additional filtering
      if (filterType === 'boosted') {
        filteredData = filteredData.filter((i: RankedInfluencer) => i.is_boosted);
      } else if (filterType === 'top_rated') {
        filteredData = filteredData.sort((a: RankedInfluencer, b: RankedInfluencer) => 
          (b.rating || 0) - (a.rating || 0)
        );
      }
      
      setInfluencers(filteredData);
    } catch (error) {
      console.error('Error loading influencers:', error);
      toast.error('Failed to load influencers');
    } finally {
      setLoading(false);
    }
  };

  const filteredInfluencers = influencers.filter(influencer =>
    (influencer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    influencer.username?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectInfluencer = (influencerId: string) => {
    if (onSelect) {
      onSelect(influencerId);
    }
  };

  const getBoostBadge = (influencer: RankedInfluencer) => {
    if (!influencer.is_boosted) return null;
    
    return (
      <Badge 
        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1"
      >
        <Zap className="h-3 w-3" />
        Boosted
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Select Influencers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search influencers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Influencers</SelectItem>
              <SelectItem value="boosted">Top Boosted</SelectItem>
              <SelectItem value="top_rated">Best Performance</SelectItem>
            </SelectContent>
          </Select>

          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              <SelectItem value="Lagos">Lagos</SelectItem>
              <SelectItem value="Abuja">Abuja</SelectItem>
              <SelectItem value="Port Harcourt">Port Harcourt</SelectItem>
              <SelectItem value="Ibadan">Ibadan</SelectItem>
              <SelectItem value="Kano">Kano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Influencer List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredInfluencers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No influencers found</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredInfluencers.map((influencer, index) => {
              const isSelected = selectedInfluencers.includes(influencer.user_id);
              
              return (
                <div
                  key={influencer.user_id}
                  className={`relative flex items-center justify-between p-4 border rounded-lg transition-all ${
                    influencer.is_boosted 
                      ? 'border-amber-300 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20' 
                      : 'border-border hover:border-primary/50'
                  } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                >
                  {/* Rank Badge */}
                  <div className="absolute -left-2 -top-2 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                    {index + 1}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                      {influencer.avatar_url ? (
                        <img 
                          src={influencer.avatar_url} 
                          alt={influencer.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Users className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{influencer.full_name}</p>
                        {getBoostBadge(influencer)}
                      </div>
                      <p className="text-sm text-muted-foreground">@{influencer.username || 'user'}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {(influencer.rating || 0).toFixed(1)}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {(influencer.completion_rate || 0).toFixed(0)}% completion
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {(influencer.follower_count || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {influencer.is_boosted && (
                      <div className="text-xs text-amber-600 text-right hidden sm:block">
                        <p className="font-medium">Why first?</p>
                        <p>Visibility boosted</p>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => handleSelectInfluencer(influencer.user_id)}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Selected
                        </>
                      ) : (
                        'Select'
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
