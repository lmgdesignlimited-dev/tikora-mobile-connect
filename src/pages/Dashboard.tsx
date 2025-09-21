import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Star, 
  Music, 
  Camera,
  Building,
  Plus
} from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    campaigns: 0,
    earnings: 0,
    rating: 0,
    followers: 0,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
      
      // Update stats based on profile data
      setStats({
        campaigns: data.completed_campaigns || 0,
        earnings: data.total_earnings || 0,
        rating: data.rating || 0,
        followers: data.follower_count || 0,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'artist':
        return <Music className="h-5 w-5" />;
      case 'influencer':
        return <Camera className="h-5 w-5" />;
      case 'business':
        return <Building className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'artist':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'influencer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'business':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              {getUserTypeIcon(profile?.user_type)}
              <h1 className="text-2xl font-bold">
                Welcome back, {profile?.full_name || 'User'}!
              </h1>
            </div>
            <Badge className={getUserTypeColor(profile?.user_type)}>
              {profile?.user_type?.charAt(0).toUpperCase() + profile?.user_type?.slice(1)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Here's what's happening with your Tikora account today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{stats.campaigns}</div>
              <p className="text-xs text-muted-foreground">
                {profile?.user_type === 'influencer' ? 'Completed' : 'Active'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-success" />
                Earnings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">₦{stats.earnings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" />
                Rating
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{stats.rating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Average rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Followers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{stats.followers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total followers</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profile?.user_type === 'artist' && (
                <Button variant="gradient" className="justify-start gap-3 h-auto p-4">
                  <Plus className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Promote Your Song</div>
                    <div className="text-sm opacity-90">Get influencers to use your music</div>
                  </div>
                </Button>
              )}
              
              {profile?.user_type === 'business' && (
                <Button variant="gradient" className="justify-start gap-3 h-auto p-4">
                  <Plus className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Create Campaign</div>
                    <div className="text-sm opacity-90">Launch your next marketing campaign</div>
                  </div>
                </Button>
              )}
              
              {profile?.user_type === 'influencer' && (
                <Button variant="gradient" className="justify-start gap-3 h-auto p-4">
                  <Plus className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Browse Campaigns</div>
                    <div className="text-sm opacity-90">Find new opportunities to earn</div>
                  </div>
                </Button>
              )}
              
              <Button variant="outline" className="justify-start gap-3 h-auto p-4">
                <DollarSign className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Fund Wallet</div>
                  <div className="text-sm text-muted-foreground">Add money to your account</div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start gap-3 h-auto p-4">
                <Star className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">View Analytics</div>
                  <div className="text-sm text-muted-foreground">Track your performance</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">No recent activity</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start creating campaigns or applying to opportunities to see your activity here.
              </p>
              <Button variant="outline">Explore Opportunities</Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <MobileNavigation />
    </div>
  );
}