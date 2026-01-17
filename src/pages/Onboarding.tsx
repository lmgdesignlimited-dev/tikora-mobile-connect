import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingWizard, RoleSelect } from '@/components/onboarding';

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'artist' | 'influencer' | 'business' | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      try {
        // Check if onboarding is already complete
        const { data: onboarding } = await supabase
          .from('onboarding_progress')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (onboarding?.is_completed) {
          setIsComplete(true);
          return;
        }

        // Get user type from profile (may not exist yet)
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile?.user_type) {
          setUserType(profile.user_type as 'artist' | 'influencer' | 'business');
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    if (!loading && user) {
      checkOnboardingStatus();
    }
  }, [user, loading]);

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!userType) {
    return (
      <RoleSelect
        onSelected={(type) => setUserType(type)}
      />
    );
  }

  return (
    <OnboardingWizard
      userType={userType}
      onComplete={() => navigate('/dashboard')}
    />
  );
}
