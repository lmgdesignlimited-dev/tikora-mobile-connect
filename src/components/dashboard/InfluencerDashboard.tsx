import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  TrendingUp, 
  DollarSign, 
  Star,
  Clock,
  CheckCircle,
  Music,
  Package,
  Play,
  Video,
  Upload,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { CoinWallet } from '@/components/coins/CoinWallet';
import { BoostStats } from '@/components/coins/BoostStats';
import { VideoSubmissionCard } from '@/components/content/VideoSubmissionCard';
import { SubmitContentModal } from '@/components/content/SubmitContentModal';
import { GigDiscoveryFeed } from '@/components/gigs/GigDiscoveryFeed';

export function InfluencerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [availableCampaigns, setAvailableCampaigns] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingApplications: 0,
    completedCampaigns: 0,
    totalEarnings: 0,
    rating: 0
  });
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

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
        fetchApplications(),
        fetchAvailableCampaigns(),
        fetchSubmissions()
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

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_applications')
        .select(`
          *,
          campaigns (
            id,
            title,
            campaign_type,
            budget,
            platform
          )
        `)
        .eq('influencer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);

      // Calculate stats
      const pending = data?.filter(a => a.status === 'pending').length || 0;
      const completed = data?.filter(a => a.status === 'completed').length || 0;
      const earnings = data?.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.proposed_rate || 0), 0) || 0;
      
      // Get rating from profile since applications don't have ratings
      const avgRating = profile?.rating || 0;

      setStats({
        pendingApplications: pending,
        completedCampaigns: completed,
        totalEarnings: earnings,
        rating: avgRating
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchAvailableCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .neq('creator_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Filter campaigns that user hasn't applied to yet
      const userApplications = await supabase
        .from('campaign_applications')
        .select('campaign_id')
        .eq('influencer_id', user?.id);

      const appliedCampaignIds = userApplications.data?.map(a => a.campaign_id) || [];
      const filteredCampaigns = data?.filter(c => !appliedCampaignIds.includes(c.id)) || [];
      
      setAvailableCampaigns(filteredCampaigns);
    } catch (error) {
      console.error('Error fetching available campaigns:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      // Fetch submissions without nested campaign join (no FK relationship)
      const { data: submissionsData, error } = await supabase
        .from('video_submissions')
        .select('*')
        .eq('influencer_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // If we have submissions, fetch their campaign details separately
      if (submissionsData && submissionsData.length > 0) {
        const campaignIds = [...new Set(submissionsData.map(s => s.campaign_id))];
        const { data: campaignsData } = await supabase
          .from('campaigns')
          .select('id, title, campaign_type')
          .in('id', campaignIds);
        
        // Map campaigns to submissions
        const campaignMap = new Map(campaignsData?.map(c => [c.id, c]) || []);
        const enrichedSubmissions = submissionsData.map(s => ({
          ...s,
          campaigns: campaignMap.get(s.campaign_id) || null
        }));
        
        setSubmissions(enrichedSubmissions);
      } else {
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleSubmitContent = (campaign: any) => {
    setSelectedCampaign(campaign);
    setSubmitModalOpen(true);
  };

  const handleApplyToCampaign = async (campaignId: string, proposedRate: number) => {
    try {
      const { error } = await supabase
        .from('campaign_applications')
        .insert({
          campaign_id: campaignId,
          influencer_id: user?.id,
          proposed_rate: proposedRate,
          status: 'pending'
        });

      if (error) throw error;
      
      toast.success('Application submitted successfully!');
      fetchApplications();
      fetchAvailableCampaigns();
    } catch (error) {
      console.error('Error applying to campaign:', error);
      toast.error('Failed to submit application');
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'completed':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  const getCampaignIcon = (type: string) => {
    switch (type) {
      case 'song_promotion':
        return <Music className="h-5 w-5" />;
      case 'product_promotion':
        return <Package className="h-5 w-5" />;
      default:
        return <Play className="h-5 w-5" />;
    }
  };

  // Early return with loading if still loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Camera className="h-6 w-6 text-primary" />
              Creator Hub
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
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Camera className="h-6 w-6 text-primary" />
          Creator Hub
        </h1>
        <p className="text-muted-foreground">
          Discover campaigns and grow your influence
        </p>
      </div>

      {/* Coin Wallet Section */}
      <CoinWallet />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{stats.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">Applications</p>
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
            <p className="text-xs text-muted-foreground">Campaigns</p>
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
            <div className="text-2xl font-bold">₦{stats.totalEarnings.toLocaleString()}</div>
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
      </div>

      {/* Tabs for Gigs, Applications, and Submissions */}
      <Tabs defaultValue="gigs">
        <TabsList>
          <TabsTrigger value="gigs" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Find Gigs
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-2">
            <Clock className="h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="submissions" className="gap-2">
            <Video className="h-4 w-4" />
            Submissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gigs" className="mt-4">
          <GigDiscoveryFeed />
        </TabsContent>

        <TabsContent value="applications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No applications yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {applications.slice(0, 10).map((application: any) => (
                    <div
                      key={application.id}
                      className="p-3 border rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{application.campaigns?.title}</h4>
                        <Badge className={getApplicationStatusColor(application.status)}>
                          {application.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Rate: ₦{application.proposed_rate?.toLocaleString()}</span>
                        <span>{new Date(application.created_at).toLocaleDateString()}</span>
                      </div>
                      {application.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2 gap-1"
                          onClick={() => handleSubmitContent(application.campaigns)}
                        >
                          <Upload className="h-3 w-3" />
                          Submit Content
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <Video className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No submissions yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Apply to campaigns and submit your content to see them here
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {submissions.map((submission) => (
                  <VideoSubmissionCard
                    key={submission.id}
                    submission={submission}
                    onRefresh={fetchSubmissions}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Boost Stats Section */}
      <BoostStats />

      {/* Submit Content Modal */}
      {selectedCampaign && (
        <SubmitContentModal
          open={submitModalOpen}
          onOpenChange={setSubmitModalOpen}
          campaignId={selectedCampaign.id}
          campaignTitle={selectedCampaign.title}
          defaultPlatform={selectedCampaign.platform || 'tiktok'}
          onSuccess={() => {
            fetchSubmissions();
            fetchApplications();
          }}
        />
      )}
    </div>
  );
}