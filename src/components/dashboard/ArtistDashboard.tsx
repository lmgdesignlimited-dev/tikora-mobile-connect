import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Music, 
  TrendingUp, 
  DollarSign, 
  Plus,
  Play,
  Eye,
  Crown,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  Megaphone,
  BarChart3,
  Video,
  UserPlus
} from 'lucide-react';
import { CampaignWizard } from '@/components/campaigns/CampaignWizard';
import { ReferralCard } from '@/components/dashboard/ReferralCard';
import { ApplicationApprovalPanel } from '@/components/dashboard/ApplicationApprovalPanel';
import { toast } from 'sonner';

export function ArtistDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [videoSubmissions, setVideoSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalSpent: 0,
    completedCampaigns: 0,
    pendingVideos: 0,
    approvedVideos: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [showTikTokClaim, setShowTikTokClaim] = useState(false);
  const [showAudiomackClaim, setShowAudiomackClaim] = useState(false);
  const [audiomackData, setAudiomackData] = useState({ username: '', password: '' });

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProfile(), fetchCampaigns(), fetchClaims(), fetchVideoSubmissions()]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user?.id).maybeSingle();
    setProfile(data);
  };

  const fetchCampaigns = async () => {
    const { data } = await supabase
      .from('campaigns')
      .select('*, campaign_applications(id, status)')
      .eq('creator_id', user?.id)
      .order('created_at', { ascending: false });
    setCampaigns(data || []);
    calculateStats(data || []);
  };

  const fetchClaims = async () => {
    const { data } = await supabase.from('profile_claims').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    setClaims(data || []);
  };

  const fetchVideoSubmissions = async () => {
    const { data } = await supabase
      .from('video_submissions')
      .select('*, campaigns!inner(creator_id, title)')
      .eq('campaigns.creator_id', user?.id)
      .order('created_at', { ascending: false });
    setVideoSubmissions(data || []);
  };

  const calculateStats = (campaignData: any[]) => {
    setStats({
      activeCampaigns: campaignData.filter(c => c.status === 'active').length,
      completedCampaigns: campaignData.filter(c => c.status === 'completed').length,
      totalSpent: campaignData.reduce((sum, c) => sum + ((c.videos_submitted || 0) * (c.cost_per_video || 0)), 0),
      pendingVideos: videoSubmissions.filter(v => v.status === 'pending').length,
      approvedVideos: videoSubmissions.filter(v => v.status === 'approved').length,
    });
  };

  const handleTikTokClaim = async () => {
    try {
      const { error } = await supabase.from('profile_claims').insert({ user_id: user?.id, claim_type: 'tiktok', fee_amount: 5000, submission_data: {} });
      if (error) throw error;
      toast.success('TikTok claim submitted successfully!');
      setShowTikTokClaim(false);
      fetchClaims();
    } catch { toast.error('Failed to submit TikTok claim'); }
  };

  const handleAudiomackClaim = async () => {
    if (!audiomackData.username || !audiomackData.password) { toast.error('Please fill in all fields'); return; }
    try {
      const { error } = await supabase.from('profile_claims').insert({
        user_id: user?.id, claim_type: 'audiomack', fee_amount: 20000,
        submission_data: { username: audiomackData.username, password_hint: audiomackData.password.substring(0, 3) + '*'.repeat(audiomackData.password.length - 3) }
      });
      if (error) throw error;
      toast.success('Audiomack monetization request submitted!');
      setShowAudiomackClaim(false);
      setAudiomackData({ username: '', password: '' });
      fetchClaims();
    } catch { toast.error('Failed to submit Audiomack request'); }
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'completed': return 'bg-primary/10 text-primary border-primary/20';
      case 'paused': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getClaimStatus = (type: string) => claims.find(c => c.claim_type === type);

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Artist Studio</h1><p className="text-muted-foreground">Loading...</p></div>
        <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* === HERO: Campaign-First Header === */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Artist Studio
          </h1>
          <p className="text-muted-foreground">Create campaigns → Get influencers → Track results</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} variant="gradient" size="lg" className="gap-2 shadow-glow">
          <Plus className="h-5 w-5" />
          Promote Song
        </Button>
      </div>

      {/* === STATS === */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Active</CardTitle></CardHeader>
          <CardContent className="pt-0"><div className="text-2xl font-bold">{stats.activeCampaigns}</div><p className="text-xs text-muted-foreground">Campaigns running</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Eye className="h-4 w-4 text-primary" />Videos</CardTitle></CardHeader>
          <CardContent className="pt-0"><div className="text-2xl font-bold">{stats.approvedVideos}</div><p className="text-xs text-muted-foreground">Approved</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4 text-destructive" />Spent</CardTitle></CardHeader>
          <CardContent className="pt-0"><div className="text-2xl font-bold">₦{stats.totalSpent.toLocaleString()}</div><p className="text-xs text-muted-foreground">Total investment</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4 text-warning" />Pending</CardTitle></CardHeader>
          <CardContent className="pt-0"><div className="text-2xl font-bold">{stats.pendingVideos}</div><p className="text-xs text-muted-foreground">Awaiting review</p></CardContent>
        </Card>
      </div>

      {/* === PRIMARY: Campaign Tabs === */}
      <Tabs defaultValue="campaigns">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="campaigns" className="gap-2"><BarChart3 className="h-4 w-4" />My Campaigns</TabsTrigger>
          <TabsTrigger value="applications" className="gap-2"><UserPlus className="h-4 w-4" />Applications</TabsTrigger>
          <TabsTrigger value="submissions" className="gap-2"><Video className="h-4 w-4" />Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Your Song Campaigns</CardTitle></CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No campaigns yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Start promoting your music by creating your first campaign</p>
                  <Button onClick={() => setShowCreateModal(true)} variant="gradient">Create Campaign</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.slice(0, 5).map((campaign: any) => (
                    <div key={campaign.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{campaign.title}</h4>
                          <p className="text-sm text-muted-foreground">{campaign.influencer_tier} • {campaign.campaign_subtype}</p>
                        </div>
                        <Badge className={getCampaignStatusColor(campaign.status)}>{campaign.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Requested:</span><div className="font-medium">{campaign.videos_requested}</div></div>
                        <div><span className="text-muted-foreground">Submitted:</span><div className="font-medium">{campaign.videos_submitted}</div></div>
                        <div><span className="text-muted-foreground">Approved:</span><div className="font-medium text-success">{campaign.videos_approved}</div></div>
                        <div><span className="text-muted-foreground">Cost/Video:</span><div className="font-medium">₦{campaign.cost_per_video?.toLocaleString()}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Manage Applications</CardTitle></CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Create a campaign first to see applications</p>
              ) : (
                <div className="space-y-6">
                  {campaigns.filter(c => c.status === 'active').map((campaign: any) => (
                    <div key={campaign.id}>
                      <h4 className="font-medium text-sm mb-2">{campaign.title}</h4>
                      <ApplicationApprovalPanel campaignId={campaign.id} campaignTitle={campaign.title} onUpdate={fetchCampaigns} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Video Submissions</CardTitle></CardHeader>
            <CardContent>
              {videoSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No submissions yet</h3>
                  <p className="text-sm text-muted-foreground">Submissions appear here once influencers create content</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {videoSubmissions.slice(0, 10).map((submission: any) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                          {submission.status === 'approved' && <CheckCircle className="h-5 w-5 text-success" />}
                          {submission.status === 'pending' && <Clock className="h-5 w-5 text-warning" />}
                          {submission.status === 'rejected' && <XCircle className="h-5 w-5 text-destructive" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{submission.campaigns?.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{submission.platform} • {submission.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">₦{submission.earnings?.toLocaleString() || 0}</p>
                        <p className="text-xs text-muted-foreground">{new Date(submission.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* === SECONDARY: Sub-Services (Collapsible) === */}
      <Collapsible open={servicesOpen} onOpenChange={setServicesOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between gap-2">
            <span className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              Growth Services (TikTok Claim, Audiomack, CapCut, etc.)
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TikTok Artist Claim */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><Crown className="h-5 w-5 text-primary" />TikTok Artist Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Claim your official TikTok artist profile</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium">₦5,000</span>
                  {getClaimStatus('tiktok') ? (
                    <Badge className={getClaimStatus('tiktok')?.status === 'approved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                      {getClaimStatus('tiktok')?.status}
                    </Badge>
                  ) : (
                    <Dialog open={showTikTokClaim} onOpenChange={setShowTikTokClaim}>
                      <DialogTrigger asChild><Button size="sm" variant="gradient">Claim Profile</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Claim TikTok Artist Profile</DialogTitle></DialogHeader>
                        <p className="text-sm text-muted-foreground">Our team will process your application within 2-3 business days.</p>
                        <div className="flex items-center justify-between p-4 border rounded-lg"><span>Service Fee</span><span className="font-bold">₦5,000</span></div>
                        <Button onClick={handleTikTokClaim} className="w-full">Submit Claim Request</Button>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Audiomack Monetization */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><Music className="h-5 w-5 text-primary" />Audiomack Monetization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Enable monetization on your Audiomack account</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium">₦20,000</span>
                  {getClaimStatus('audiomack') ? (
                    <Badge className={getClaimStatus('audiomack')?.status === 'approved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                      {getClaimStatus('audiomack')?.status}
                    </Badge>
                  ) : (
                    <Dialog open={showAudiomackClaim} onOpenChange={setShowAudiomackClaim}>
                      <DialogTrigger asChild><Button size="sm" variant="gradient">Enable</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Audiomack Monetization Setup</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div><Label>Audiomack Username</Label><Input value={audiomackData.username} onChange={e => setAudiomackData(p => ({ ...p, username: e.target.value }))} placeholder="Your Audiomack username" /></div>
                          <div><Label>Audiomack Password</Label><Input type="password" value={audiomackData.password} onChange={e => setAudiomackData(p => ({ ...p, password: e.target.value }))} placeholder="Your Audiomack password" /></div>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg"><span>Service Fee</span><span className="font-bold">₦20,000</span></div>
                        <Button onClick={handleAudiomackClaim} className="w-full">Submit Request</Button>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Referral Card */}
      <ReferralCard />

      <CampaignWizard open={showCreateModal} onOpenChange={setShowCreateModal} userType="artist" onSuccess={fetchCampaigns} />
    </div>
  );
}
