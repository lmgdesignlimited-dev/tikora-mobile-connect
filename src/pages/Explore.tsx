import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { UserLayout } from '@/components/layout/UserLayout';
import ExploreArtist from './ExploreArtist';
import ExploreBusiness from './ExploreBusiness';
import { GigDiscoveryFeed } from '@/components/gigs/GigDiscoveryFeed';
import { Search, Filter, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Explore() {
  const { user, loading } = useAuth();
  const [userType, setUserType] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          setUserType(data?.user_type || null);
          setProfileLoading(false);
        });
    }
  }, [user?.id]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (userType === 'artist') return <ExploreArtist />;
  if (userType === 'business') return <ExploreBusiness />;

  return (
    <UserLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            Explore Campaigns
          </h1>
          <p className="text-muted-foreground">Discover trending opportunities and find your next gig</p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns, brands, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Trending Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">🎵 Music Promotion</Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">📦 Product Reviews</Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">🎬 Movie Trailers</Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">📱 App Downloads</Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">🎉 Events</Badge>
            </div>
          </CardContent>
        </Card>

        <GigDiscoveryFeed />
      </div>
    </UserLayout>
  );
}
