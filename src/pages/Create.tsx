import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CampaignWizard } from '@/components/campaigns/CampaignWizard';
import { 
  Plus, 
  Music, 
  Package, 
  Film, 
  Smartphone, 
  Calendar,
  Megaphone 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

const campaignTypes = [
  {
    id: 'song_promotion',
    title: 'Song Promotion',
    description: 'Promote your music with viral TikTok videos',
    icon: Music,
    color: 'text-purple-500 bg-purple-500/10'
  },
  {
    id: 'product_promotion',
    title: 'Product Review',
    description: 'Get influencers to showcase your products',
    icon: Package,
    color: 'text-blue-500 bg-blue-500/10'
  },
  {
    id: 'movie_promotion',
    title: 'Movie/Show Promo',
    description: 'Build buzz for your film or series',
    icon: Film,
    color: 'text-red-500 bg-red-500/10'
  },
  {
    id: 'app_promotion',
    title: 'App Promotion',
    description: 'Drive downloads for your mobile app',
    icon: Smartphone,
    color: 'text-green-500 bg-green-500/10'
  },
  {
    id: 'event_promotion',
    title: 'Event Promotion',
    description: 'Spread the word about your event',
    icon: Calendar,
    color: 'text-orange-500 bg-orange-500/10'
  },
  {
    id: 'brand_awareness',
    title: 'Brand Awareness',
    description: 'Build recognition for your brand',
    icon: Megaphone,
    color: 'text-pink-500 bg-pink-500/10'
  }
];

export default function Create() {
  const { user, loading } = useAuth();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [userType, setUserType] = useState<'artist' | 'business'>('business');

  useEffect(() => {
    if (user) {
      fetchUserType();
    }
  }, [user]);

  const fetchUserType = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', user?.id)
      .maybeSingle();
    
    if (data && (data.user_type === 'artist' || data.user_type === 'business')) {
      setUserType(data.user_type);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
              <Plus className="h-6 w-6 text-primary" />
              Create Campaign
            </h1>
            <p className="text-muted-foreground mt-1">
              Launch a new marketing campaign and reach thousands
            </p>
          </div>

          {/* Quick Create Button */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="py-6">
              <div className="text-center">
                <Button 
                  size="lg" 
                  className="gap-2"
                  onClick={() => setWizardOpen(true)}
                >
                  <Plus className="h-5 w-5" />
                  Start New Campaign
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Our wizard will guide you through the process
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Types Grid */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Choose Campaign Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaignTypes.map((type) => (
                <Card 
                  key={type.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setWizardOpen(true)}
                >
                  <CardHeader className="pb-2">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${type.color} mb-2`}>
                      <type.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-base">{type.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {type.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <MobileNavigation />

      {/* Campaign Wizard */}
      <CampaignWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        userType={userType}
        onSuccess={() => {
          setWizardOpen(false);
        }}
      />
    </div>
  );
}
