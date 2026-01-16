import { useEffect, useState, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArtistDashboard } from '@/components/dashboard/ArtistDashboard';
import { InfluencerDashboard } from '@/components/dashboard/InfluencerDashboard';
import { BusinessDashboard } from '@/components/dashboard/BusinessDashboard';
import { Music, Camera, Building, Users, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    campaigns: 0,
    earnings: 0,
    rating: 0,
    followers: 0,
  });

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    
    setProfileLoading(true);
    setProfileError(null);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
        setProfileError('Failed to load profile. Please try again.');
        return;
      }
      
      setProfile(data);
      
      // Update stats based on profile data
      if (data) {
        setStats({
          campaigns: data.completed_campaigns || 0,
          earnings: data.total_earnings || 0,
          rating: data.rating || 0,
          followers: data.follower_count || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfileError('An unexpected error occurred. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id, fetchProfile]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
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

  const renderDashboard = () => {
    // Show loading state while fetching profile
    if (profileLoading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      );
    }

    // Show error state with retry option
    if (profileError) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">{profileError}</p>
          <Button onClick={fetchProfile} variant="outline">
            Try Again
          </Button>
        </div>
      );
    }

    // If profile is null, user needs to complete onboarding
    if (!profile) {
      return (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Welcome to Tikora!</h2>
          <p className="text-muted-foreground mb-6">
            Complete your profile setup to get started.
          </p>
          <Button asChild variant="gradient">
            <Link to="/onboarding">Complete Setup</Link>
          </Button>
        </div>
      );
    }

    switch (profile?.user_type) {
      case 'artist':
        return <ArtistDashboard />;
      case 'influencer':
        return <InfluencerDashboard />;
      case 'business':
        return <BusinessDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Profile Setup Required</h2>
            <p className="text-muted-foreground">
              Please complete your profile setup to access your dashboard.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        {renderDashboard()}
      </main>

      <MobileNavigation />
    </div>
  );
}