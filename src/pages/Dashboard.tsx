import { useEffect, useState, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserLayout } from '@/components/layout/UserLayout';
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
        setProfileError('Failed to load profile. Please try again.');
        return;
      }
      setProfile(data);
    } catch {
      setProfileError('An unexpected error occurred. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) fetchProfile();
  }, [user?.id, fetchProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const renderDashboard = () => {
    if (profileLoading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      );
    }
    if (profileError) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">{profileError}</p>
          <Button onClick={fetchProfile} variant="outline">Try Again</Button>
        </div>
      );
    }
    if (!profile) {
      return (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Welcome to Tikora!</h2>
          <p className="text-muted-foreground mb-6">Complete your profile setup to get started.</p>
          <Button asChild variant="gradient">
            <Link to="/onboarding">Complete Setup</Link>
          </Button>
        </div>
      );
    }
    switch (profile?.user_type) {
      case 'artist': return <ArtistDashboard />;
      case 'influencer': return <InfluencerDashboard />;
      case 'business': return <BusinessDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Profile Setup Required</h2>
            <p className="text-muted-foreground">Please complete your profile setup.</p>
          </div>
        );
    }
  };

  return (
    <UserLayout>
      {renderDashboard()}
    </UserLayout>
  );
}
