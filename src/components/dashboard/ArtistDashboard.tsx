import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Music, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Star,
  Plus,
  Play,
  Eye,
  Heart,
  Share2
} from 'lucide-react';
import { CreateCampaignModal } from './CreateCampaignModal';
import { toast } from 'sonner';

export function ArtistDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalViews: 0,
    totalEarnings: 0,
    completedCampaigns: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchCampaigns();
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
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_applications (
            id,
            status
          )
        `)
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);

      // Calculate stats
      const activeCampaigns = data?.filter(c => c.status === 'active').length || 0;
      const completedCampaigns = data?.filter(c => c.status === 'completed').length || 0;
      const totalViews = data?.reduce((sum, c) => {
        const completedApplications = c.campaign_applications?.filter(app => app.status === 'completed').length || 0;
        return sum + completedApplications;
      }, 0) || 0;
      
      setStats({
        activeCampaigns,
        totalViews: totalViews * 1000, // Estimate views
        totalEarnings: profile?.total_earnings || 0,
        completedCampaigns
      });
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const handleCreateCampaign = () => {
    setShowCreateModal(true);
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      case 'completed':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'paused':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            Artist Studio
          </h1>
          <p className="text-muted-foreground">
            Promote your music and connect with influencers
          </p>
        </div>
        <Button onClick={handleCreateCampaign} variant="gradient" className="gap-2">
          <Plus className="h-4 w-4" />
          Promote Song
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">Campaigns running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Views
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              Spent
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">₦{stats.totalEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total investment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-warning" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{stats.completedCampaigns}</div>
            <p className="text-xs text-muted-foreground">Campaigns done</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Your Song Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No campaigns yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start promoting your music by creating your first campaign
              </p>
              <Button onClick={handleCreateCampaign} variant="gradient">
                Create Campaign
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.slice(0, 5).map((campaign: any) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Music className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{campaign.title}</h4>
                      <p className="text-sm text-muted-foreground">{campaign.song_title}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {campaign.current_applications} applications
                        </span>
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          {campaign.campaign_applications?.filter((app: any) => app.status === 'completed').length || 0} videos
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getCampaignStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                    <p className="text-sm font-medium mt-1">
                      ₦{campaign.total_budget.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCampaignModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        userType="artist"
        onSuccess={() => {
          fetchCampaigns();
          toast.success('Campaign created successfully!');
        }}
      />
    </div>
  );
}