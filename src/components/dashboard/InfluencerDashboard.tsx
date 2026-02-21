import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Briefcase,
  MapPin,
  Users,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { CoinWallet } from '@/components/coins/CoinWallet';
import { BoostStats } from '@/components/coins/BoostStats';
import { VideoSubmissionCard } from '@/components/content/VideoSubmissionCard';
import { SubmitContentModal } from '@/components/content/SubmitContentModal';
import { GigDiscoveryFeed } from '@/components/gigs/GigDiscoveryFeed';
import { ReferralCard } from '@/components/dashboard/ReferralCard';

const getTierFromFollowers = (count: number): string => {
  if (count >= 100000) return 'super';
  if (count >= 10000) return 'top';
  if (count >= 1000) return 'mid';
  return 'starter';
};

const getTierBadgeStyle = (tier: string) => {
  switch (tier) {
    case 'super': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'top': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    case 'mid': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

export function InfluencerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendingApplications: 0, completedCampaigns: 0, totalEarnings: 0, rating: 0 });
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProfile(), fetchApplications(), fetchSubmissions()]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user?.id).maybeSingle();
    if (data) {
      // Auto-assign tier based on follower count
      const calculatedTier = getTierFromFollowers(data.follower_count || 0);
      if (data.influencer_tier !== calculatedTier) {
        await supabase.from('profiles').update({ influencer_tier: calculatedTier }).eq('user_id', user?.id);
        data.influencer_tier = calculatedTier;
      }
      setProfile(data);
    }
  };

  const fetchApplications = async () => {
    const { data } = await supabase
      .from('campaign_applications')
      .select('*, campaigns(id, title, campaign_type, budget, platform)')
      .eq('influencer_id', user?.id)
      .order('created_at', { ascending: false });
    setApplications(data || []);
    const pending = data?.filter(a => a.status === 'pending').length || 0;
    const completed = data?.filter(a => a.status === 'completed').length || 0;
    const earnings = data?.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.proposed_rate || 0), 0) || 0;
    setStats({ pendingApplications: pending, completedCampaigns: completed, totalEarnings: earnings, rating: profile?.rating || 0 });
  };

  const fetchSubmissions = async () => {
    const { data: submissionsData } = await supabase
      .from('video_submissions')
      .select('*')
      .eq('influencer_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (submissionsData && submissionsData.length > 0) {
      const campaignIds = [...new Set(submissionsData.map(s => s.campaign_id))];
      const { data: campaignsData } = await supabase.from('campaigns').select('id, title, campaign_type').in('id', campaignIds);
      const campaignMap = new Map(campaignsData?.map(c => [c.id, c]) || []);
      setSubmissions(submissionsData.map(s => ({ ...s, campaigns: campaignMap.get(s.campaign_id) || null })));
    } else {
      setSubmissions([]);
    }
  };

  const handleSubmitContent = (campaign: any) => {
    setSelectedCampaign(campaign);
    setSubmitModalOpen(true);
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/10 text-success border-success/20';
      case 'completed': return 'bg-primary/10 text-primary border-primary/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Camera className="h-6 w-6 text-primary" />Creator Hub</h1></div>
        <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}</div>
      </div>
    );
  }

  const tier = profile?.influencer_tier || 'starter';

  return (
    <div className="space-y-6">
      {/* === Profile Card === */}
      <Card className="border-primary/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 shrink-0">
              <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {profile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 w-full">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-bold truncate">{profile?.full_name}</h2>
                <Badge className={getTierBadgeStyle(tier)}>
                  {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier
                </Badge>
                {profile?.verification_status === 'verified' && (
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                )}
              </div>
              {profile?.username && <p className="text-sm text-muted-foreground mb-2">@{profile.username}</p>}
              {profile?.bio && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{profile.bio}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {(profile?.city || profile?.country) && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                )}
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{(profile?.follower_count || 0).toLocaleString()} followers</span>
                {(profile?.platforms?.length > 0) && (
                  <span className="flex items-center gap-1"><Camera className="h-3 w-3" />{profile.platforms.join(', ')}</span>
                )}
                {profile?.custom_price > 0 && (
                  <span className="flex items-center gap-1 font-medium text-foreground"><DollarSign className="h-3 w-3" />Custom Rate: ₦{profile.custom_price.toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Card */}
      <ReferralCard />

      {/* Coin Wallet */}
      <CoinWallet />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4 text-warning" />Pending</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-2xl font-bold">{stats.pendingApplications}</div><p className="text-xs text-muted-foreground">Applications</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" />Completed</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-2xl font-bold">{stats.completedCampaigns}</div><p className="text-xs text-muted-foreground">Campaigns</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4 text-success" />Earnings</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-2xl font-bold">₦{stats.totalEarnings.toLocaleString()}</div><p className="text-xs text-muted-foreground">Total earned</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Star className="h-4 w-4 text-warning" />Rating</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-2xl font-bold">{(stats.rating || 0).toFixed(1)}</div><p className="text-xs text-muted-foreground">Average</p></CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="gigs">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="gigs" className="gap-2"><Briefcase className="h-4 w-4" />Find Gigs</TabsTrigger>
          <TabsTrigger value="applications" className="gap-2"><Clock className="h-4 w-4" />Applications</TabsTrigger>
          <TabsTrigger value="submissions" className="gap-2"><Video className="h-4 w-4" />Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="gigs" className="mt-4"><GigDiscoveryFeed /></TabsContent>

        <TabsContent value="applications" className="mt-4">
          <Card>
            <CardHeader><CardTitle>My Applications</CardTitle></CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8"><Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No applications yet</p></div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {applications.slice(0, 10).map((app: any) => (
                    <div key={app.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{app.campaigns?.title}</h4>
                        <Badge className={getApplicationStatusColor(app.status)}>{app.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Rate: ₦{app.proposed_rate?.toLocaleString()}</span>
                        <span>{new Date(app.created_at).toLocaleDateString()}</span>
                      </div>
                      {app.status === 'approved' && (
                        <Button size="sm" variant="outline" className="w-full mt-2 gap-1" onClick={() => handleSubmitContent(app.campaigns)}>
                          <Upload className="h-3 w-3" />Submit Content
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
          {submissions.length === 0 ? (
            <Card><CardContent className="py-8 text-center"><Video className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No submissions yet</p></CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {submissions.map(s => <VideoSubmissionCard key={s.id} submission={s} onRefresh={fetchSubmissions} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BoostStats />

      {selectedCampaign && (
        <SubmitContentModal
          open={submitModalOpen}
          onOpenChange={setSubmitModalOpen}
          campaignId={selectedCampaign.id}
          campaignTitle={selectedCampaign.title}
          defaultPlatform={selectedCampaign.platform || 'tiktok'}
          onSuccess={() => { fetchSubmissions(); fetchApplications(); }}
        />
      )}
    </div>
  );
}
