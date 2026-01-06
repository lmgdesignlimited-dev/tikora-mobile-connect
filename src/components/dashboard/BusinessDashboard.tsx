import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  Plus,
  Package,
  Truck,
  CheckCircle,
  Clock,
  BarChart3,
  UserPlus,
  Music,
  Film,
  Calendar,
  Smartphone,
  Globe,
  Camera
} from 'lucide-react';
import { CampaignWizard } from '@/components/campaigns/CampaignWizard';
import { InfluencerSelection } from '@/components/business/InfluencerSelection';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export function BusinessDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalReach: 0,
    totalSpent: 0,
    completedCampaigns: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user?.id]); // Only depend on user.id

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchCampaigns()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
        return;
      }
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
            status,
            estimated_reach,
            payment_status
          )
        `)
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);

      // Calculate stats
      const activeCampaigns = data?.filter(c => c.status === 'active').length || 0;
      const completedCampaigns = data?.filter(c => c.status === 'completed').length || 0;
      const totalReach = data?.reduce((sum, c) => {
        const campaignReach = c.campaign_applications?.reduce((appSum: number, app: any) => 
          appSum + (app.estimated_reach || 0), 0) || 0;
        return sum + campaignReach;
      }, 0) || 0;
      
      setStats({
        activeCampaigns,
        totalReach,
        totalSpent: profile?.total_spent || 0,
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

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'music':
        return <Music className="h-5 w-5" />;
      case 'movie':
        return <Film className="h-5 w-5" />;
      case 'event':
        return <Calendar className="h-5 w-5" />;
      case 'app':
        return <Smartphone className="h-5 w-5" />;
      case 'website':
        return <Globe className="h-5 w-5" />;
      case 'product':
        return <Package className="h-5 w-5" />;
      case 'production':
        return <Camera className="h-5 w-5" />;
      default:
        return <TrendingUp className="h-5 w-5" />;
    }
  };

  const getDeliveryStats = (campaign: any) => {
    const applications = campaign.campaign_applications || [];
    const approved = applications.filter((app: any) => app.status === 'approved');
    const completed = applications.filter((app: any) => app.status === 'completed');
    
    return { approved: approved.length, completed: completed.length };
  };

  // Early return with loading if still loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building className="h-6 w-6 text-primary" />
              Business Hub
            </h1>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            Business Hub
          </h1>
          <p className="text-muted-foreground">
            Launch campaigns and track your marketing performance
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Admin
            </Button>
          </Link>
          <Button onClick={handleCreateCampaign} variant="gradient" className="gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </div>
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
              <Users className="h-4 w-4 text-primary" />
              Reach
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{stats.totalReach.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total audience</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Spent
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">₦{stats.totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total investment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{stats.completedCampaigns}</div>
            <p className="text-xs text-muted-foreground">Campaigns done</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Campaigns and Influencers */}
      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns" className="gap-2">
            <Package className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="influencers" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Find Influencers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No campaigns yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first marketing campaign to reach your target audience
                  </p>
                  <Button onClick={handleCreateCampaign} variant="gradient">
                    Create Campaign
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.slice(0, 5).map((campaign: any) => {
                    const deliveryStats = getDeliveryStats(campaign);
                    
                    return (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            {getCampaignTypeIcon(campaign.campaign_type)}
                          </div>
                          <div>
                            <h4 className="font-medium">{campaign.title}</h4>
                            <p className="text-sm text-muted-foreground">{campaign.product_name}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {campaign.current_applications} applications
                              </span>
                              {campaign.requires_product_delivery && (
                                <span className="flex items-center gap-1">
                                  <Truck className="h-3 w-3" />
                                  {deliveryStats.completed}/{deliveryStats.approved} delivered
                                </span>
                              )}
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
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="influencers" className="mt-4">
          <InfluencerSelection />
        </TabsContent>
      </Tabs>

      <CampaignWizard
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        userType="business"
        onSuccess={() => {
          fetchCampaigns();
        }}
      />
    </div>
  );
}