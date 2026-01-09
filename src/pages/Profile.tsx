import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { WalletDashboard } from '@/components/wallet/WalletDashboard';
import { 
  User, 
  Settings, 
  LogOut, 
  Camera, 
  Music, 
  Building,
  Star,
  MapPin,
  CheckCircle,
  Edit,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showWallet, setShowWallet] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'artist': return <Music className="h-5 w-5" />;
      case 'influencer': return <Camera className="h-5 w-5" />;
      case 'business': return <Building className="h-5 w-5" />;
      default: return <User className="h-5 w-5" />;
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'artist': return 'bg-purple-100 text-purple-800';
      case 'influencer': return 'bg-blue-100 text-blue-800';
      case 'business': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (showWallet) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 pb-20">
          <div className="mb-4">
            <Button variant="ghost" onClick={() => setShowWallet(false)}>
              ← Back to Profile
            </Button>
          </div>
          <WalletDashboard />
        </main>
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <h1 className="text-xl font-bold">{profile?.full_name || 'User'}</h1>
                {profile?.username && (
                  <p className="text-muted-foreground">@{profile.username}</p>
                )}
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getUserTypeColor(profile?.user_type)}>
                    {getUserTypeIcon(profile?.user_type)}
                    <span className="ml-1 capitalize">{profile?.user_type || 'User'}</span>
                  </Badge>
                  {profile?.verification_status === 'verified' && (
                    <Badge variant="outline" className="text-primary border-primary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>

                {(profile?.city || profile?.country) && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {[profile.city, profile.country].filter(Boolean).join(', ')}
                  </p>
                )}

                {profile?.bio && (
                  <p className="text-sm text-muted-foreground mt-3 max-w-md">
                    {profile.bio}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold">{profile?.completed_campaigns || 0}</p>
                <p className="text-xs text-muted-foreground">Campaigns</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold flex items-center justify-center">
                  <Star className="h-4 w-4 text-warning mr-1" />
                  {profile?.rating?.toFixed(1) || '0.0'}
                </p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold">
                  {(profile?.follower_count || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => setShowWallet(true)}
              >
                <Wallet className="h-4 w-4" />
                Wallet & Earnings
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </CardContent>
          </Card>

          {/* Wallet Balance Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    ₦{(profile?.wallet_balance || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Available balance</p>
                </div>
                <Button onClick={() => setShowWallet(true)}>
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Sign Out */}
          <Button 
            variant="destructive" 
            className="w-full gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </main>

      <MobileNavigation />
    </div>
  );
}
