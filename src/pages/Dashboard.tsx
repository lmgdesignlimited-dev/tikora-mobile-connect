import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
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
import { Music, Camera, Building, Users } from 'lucide-react';

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

  const renderDashboard = () => {
    switch (profile?.user_type) {
      case 'artist':
        return <ArtistDashboard />;
      case 'influencer':
        return <InfluencerDashboard />;
      case 'business':
        return <BusinessDashboard />;
      default:
        return <div>Loading...</div>;
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