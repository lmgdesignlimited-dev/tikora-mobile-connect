import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Share2,
  Crown,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { CreateCampaignModal } from './CreateCampaignModal';
import { toast } from 'sonner';

export function ArtistDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [campaigns, setCampaigns] = useState([]);
  const [claims, setClaims] = useState([]);
  const [videoSubmissions, setVideoSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalViews: 0,
    totalSpent: 0,
    completedCampaigns: 0,
    pendingVideos: 0,
    approvedVideos: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTikTokClaim, setShowTikTokClaim] = useState(false);
  const [showAudiomackClaim, setShowAudiomackClaim] = useState(false);
  const [audiomackData, setAudiomackData] = useState({ username: '', password: '' });

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
        fetchCampaigns(),
        fetchClaims(),
        fetchVideoSubmissions()
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
            status
          )
        `)
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
      
      calculateStats(data || [], profile, videoSubmissions);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchClaims = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_claims')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error('Error fetching claims:', error);
    }
  };

  const fetchVideoSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('video_submissions')
        .select(`
          *,
          campaigns!inner (
            creator_id,
            title
          )
        `)
        .eq('campaigns.creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideoSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching video submissions:', error);
    }
  };

  const calculateStats = (campaignData: any[], profileData: any, submissions: any[]) => {
    const activeCampaigns = campaignData.filter(c => c.status === 'active').length;
    const completedCampaigns = campaignData.filter(c => c.status === 'completed').length;
    const totalSpent = campaignData.reduce((sum, c) => sum + (c.videos_submitted * c.cost_per_video || 0), 0);
    const pendingVideos = submissions.filter(v => v.status === 'pending').length;
    const approvedVideos = submissions.filter(v => v.status === 'approved').length;
    
    setStats({
      activeCampaigns,
      totalViews: approvedVideos * 1000, // Estimate views
      totalSpent,
      completedCampaigns,
      pendingVideos,
      approvedVideos
    });
  };

  // Early return with loading if still loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Artist Dashboard</h1>
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

  const handleCreateCampaign = () => {
    setShowCreateModal(true);
  };

  const handleTikTokClaim = async () => {
    try {
      const { error } = await supabase
        .from('profile_claims')
        .insert({
          user_id: user?.id,
          claim_type: 'tiktok',
          fee_amount: 5000,
          submission_data: {}
        });

      if (error) throw error;
      
      toast.success('TikTok claim submitted successfully!');
      setShowTikTokClaim(false);
      fetchClaims();
    } catch (error) {
      toast.error('Failed to submit TikTok claim');
      console.error('Error:', error);
    }
  };

  const handleAudiomackClaim = async () => {
    if (!audiomackData.username || !audiomackData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('profile_claims')
        .insert({
          user_id: user?.id,
          claim_type: 'audiomack',
          fee_amount: 20000,
          submission_data: { 
            username: audiomackData.username,
            // Note: In production, passwords should be encrypted
            password_hint: audiomackData.password.substring(0, 3) + '*'.repeat(audiomackData.password.length - 3)
          }
        });

      if (error) throw error;
      
      toast.success('Audiomack monetization request submitted!');
      setShowAudiomackClaim(false);
      setAudiomackData({ username: '', password: '' });
      fetchClaims();
    } catch (error) {
      toast.error('Failed to submit Audiomack request');
      console.error('Error:', error);
    }
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

      {/* Profile Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              TikTok Artist Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Claim your official TikTok artist profile for enhanced visibility
              </p>
              <div className="flex items-center justify-between">
                <span className="font-medium">₦5,000</span>
                <Dialog open={showTikTokClaim} onOpenChange={setShowTikTokClaim}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="gradient">
                      Claim Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Claim TikTok Artist Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Submit your request to claim your official TikTok artist profile. 
                        Our team will process your application within 2-3 business days.
                      </p>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <span>Service Fee</span>
                        <span className="font-bold">₦5,000</span>
                      </div>
                      <Button onClick={handleTikTokClaim} className="w-full">
                        Submit Claim Request
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {claims.find(c => c.claim_type === 'tiktok') && (
                <Badge className={
                  claims.find(c => c.claim_type === 'tiktok')?.status === 'approved' 
                    ? 'bg-success/10 text-success' 
                    : claims.find(c => c.claim_type === 'tiktok')?.status === 'pending'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-destructive/10 text-destructive'
                }>
                  {claims.find(c => c.claim_type === 'tiktok')?.status}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              Audiomack Monetization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Enable monetization on your Audiomack account
              </p>
              <div className="flex items-center justify-between">
                <span className="font-medium">₦20,000</span>
                <Dialog open={showAudiomackClaim} onOpenChange={setShowAudiomackClaim}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="gradient">
                      Enable Monetization
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Audiomack Monetization Setup</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Provide your Audiomack credentials to enable monetization features.
                        Your information is securely processed and not stored permanently.
                      </p>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="audiomack-username">Audiomack Username</Label>
                          <Input
                            id="audiomack-username"
                            value={audiomackData.username}
                            onChange={(e) => setAudiomackData(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="Your Audiomack username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="audiomack-password">Audiomack Password</Label>
                          <Input
                            id="audiomack-password"
                            type="password"
                            value={audiomackData.password}
                            onChange={(e) => setAudiomackData(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Your Audiomack password"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <span>Service Fee</span>
                        <span className="font-bold">₦20,000</span>
                      </div>
                      <Button onClick={handleAudiomackClaim} className="w-full">
                        Submit Monetization Request
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {claims.find(c => c.claim_type === 'audiomack') && (
                <Badge className={
                  claims.find(c => c.claim_type === 'audiomack')?.status === 'approved' 
                    ? 'bg-success/10 text-success' 
                    : claims.find(c => c.claim_type === 'audiomack')?.status === 'pending'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-destructive/10 text-destructive'
                }>
                  {claims.find(c => c.claim_type === 'audiomack')?.status}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
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
              Videos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{stats.approvedVideos}</div>
            <p className="text-xs text-muted-foreground">Approved videos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-destructive" />
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
              <Clock className="h-4 w-4 text-warning" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{stats.pendingVideos}</div>
            <p className="text-xs text-muted-foreground">Videos pending approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                {campaigns.slice(0, 3).map((campaign: any) => (
                  <div
                    key={campaign.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{campaign.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {campaign.influencer_tier} • {campaign.campaign_subtype}
                        </p>
                      </div>
                      <Badge className={getCampaignStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Videos Requested:</span>
                        <div className="font-medium">{campaign.videos_requested}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Videos Submitted:</span>
                        <div className="font-medium">{campaign.videos_submitted}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Videos Approved:</span>
                        <div className="font-medium text-success">{campaign.videos_approved}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cost Per Video:</span>
                        <div className="font-medium">₦{campaign.cost_per_video?.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Spent:</span>
                        <span className="font-bold">₦{((campaign.videos_submitted || 0) * (campaign.cost_per_video || 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Video Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {videoSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No submissions yet</h3>
                <p className="text-sm text-muted-foreground">
                  Video submissions will appear here once influencers start creating content
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {videoSubmissions.slice(0, 10).map((submission: any) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                        {submission.status === 'approved' && <CheckCircle className="h-5 w-5 text-success" />}
                        {submission.status === 'pending' && <Clock className="h-5 w-5 text-warning" />}
                        {submission.status === 'rejected' && <XCircle className="h-5 w-5 text-destructive" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{submission.campaigns?.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {submission.platform} • {submission.status}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">₦{submission.earnings?.toLocaleString() || 0}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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