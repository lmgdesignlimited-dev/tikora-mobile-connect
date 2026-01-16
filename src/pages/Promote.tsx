import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Video, 
  Play, 
  Eye, 
  MousePointer, 
  Heart,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Link as LinkIcon,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

type PromotionGoal = 'views' | 'clicks' | 'engagement';
type PromotionStatus = 'pending' | 'active' | 'paused' | 'completed' | 'cancelled' | 'rejected';

interface Promotion {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  description: string | null;
  budget: number;
  goal: PromotionGoal;
  status: PromotionStatus;
  target_views: number | null;
  target_clicks: number | null;
  target_engagement: number | null;
  achieved_views: number | null;
  achieved_clicks: number | null;
  achieved_engagement: number | null;
  spent_amount: number | null;
  created_at: string;
}

export default function Promote() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [goal, setGoal] = useState<PromotionGoal>('views');
  const [platform, setPlatform] = useState('tiktok');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchPromotions()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();
    setProfile(data);
  };

  const fetchPromotions = async () => {
    const { data, error } = await supabase
      .from('video_promotions')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setPromotions(data as Promotion[]);
    }
  };

  const handleCreatePromotion = async () => {
    if (!videoUrl || !title || !budget) {
      toast.error('Please fill in all required fields');
      return;
    }

    const budgetNum = Number(budget);
    if (isNaN(budgetNum) || budgetNum < 1000) {
      toast.error('Minimum budget is ₦1,000');
      return;
    }

    if (budgetNum > (profile?.wallet_balance || 0)) {
      toast.error('Insufficient wallet balance');
      return;
    }

    setCreating(true);
    try {
      // Create promotion
      const { error: promoError } = await supabase
        .from('video_promotions')
        .insert({
          user_id: user?.id,
          title,
          video_url: videoUrl,
          description: description || null,
          budget: budgetNum,
          goal,
          platform,
          status: 'pending',
          target_views: goal === 'views' ? Math.floor(budgetNum / 10) : null,
          target_clicks: goal === 'clicks' ? Math.floor(budgetNum / 50) : null,
          target_engagement: goal === 'engagement' ? Math.floor(budgetNum / 25) : null,
        });

      if (promoError) throw promoError;

      // Deduct from wallet
      const { error: walletError } = await supabase
        .from('profiles')
        .update({ 
          wallet_balance: (profile?.wallet_balance || 0) - budgetNum 
        })
        .eq('user_id', user?.id);

      if (walletError) throw walletError;

      // Create wallet transaction
      await supabase.from('wallet_transactions').insert({
        user_id: user?.id,
        transaction_type: 'payment',
        amount: budgetNum,
        description: `Video promotion: ${title}`,
        status: 'completed',
        reference_id: `PROMO-${Date.now()}`
      });

      toast.success('Promotion created successfully! It will be reviewed shortly.');
      
      // Reset form
      setVideoUrl('');
      setTitle('');
      setDescription('');
      setBudget('');
      setGoal('views');
      
      // Refresh data
      loadData();
    } catch (error) {
      console.error('Error creating promotion:', error);
      toast.error('Failed to create promotion');
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: PromotionStatus) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'completed': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'paused': return 'bg-muted text-muted-foreground border-border';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getGoalIcon = (g: PromotionGoal) => {
    switch (g) {
      case 'views': return <Eye className="h-4 w-4" />;
      case 'clicks': return <MousePointer className="h-4 w-4" />;
      case 'engagement': return <Heart className="h-4 w-4" />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            Promote Video
          </h1>
          <p className="text-muted-foreground">
            Get more views, clicks, and engagement for your content
          </p>
        </div>

        {/* Wallet Balance */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-xl font-bold">₦{(profile?.wallet_balance || 0).toLocaleString()}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/wallet">Fund Wallet</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="create">
          <TabsList className="mb-6">
            <TabsTrigger value="create" className="gap-2">
              <Upload className="h-4 w-4" />
              Create Promotion
            </TabsTrigger>
            <TabsTrigger value="my-promotions" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              My Promotions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Create Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Create New Promotion</CardTitle>
                  <CardDescription>
                    Promote your video to reach more people
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Video URL *</Label>
                    <Input
                      placeholder="https://tiktok.com/@user/video/..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      placeholder="My awesome video"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe your video..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <RadioGroup value={platform} onValueChange={setPlatform} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="tiktok" id="tiktok" />
                        <Label htmlFor="tiktok">TikTok</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="instagram" id="instagram" />
                        <Label htmlFor="instagram">Instagram</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="youtube" id="youtube" />
                        <Label htmlFor="youtube">YouTube</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Budget (₦) *</Label>
                    <Input
                      type="number"
                      placeholder="5000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      min={1000}
                    />
                    <p className="text-xs text-muted-foreground">Minimum ₦1,000</p>
                  </div>

                  <Button 
                    onClick={handleCreatePromotion} 
                    disabled={creating || !videoUrl || !title || !budget}
                    className="w-full"
                    variant="gradient"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Promotion
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Goal Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Choose Your Goal</CardTitle>
                  <CardDescription>
                    What do you want to achieve?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={goal} onValueChange={(v) => setGoal(v as PromotionGoal)}>
                    <div 
                      className={`flex items-start space-x-4 p-4 rounded-lg border cursor-pointer transition-colors ${goal === 'views' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                      onClick={() => setGoal('views')}
                    >
                      <RadioGroupItem value="views" id="views" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="views" className="flex items-center gap-2 cursor-pointer">
                          <Eye className="h-5 w-5 text-primary" />
                          <span className="font-medium">Views</span>
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Get more people to watch your video. Best for awareness.
                        </p>
                        <p className="text-xs text-primary mt-2">~100 views per ₦1,000</p>
                      </div>
                    </div>

                    <div 
                      className={`flex items-start space-x-4 p-4 rounded-lg border cursor-pointer transition-colors ${goal === 'clicks' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                      onClick={() => setGoal('clicks')}
                    >
                      <RadioGroupItem value="clicks" id="clicks" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="clicks" className="flex items-center gap-2 cursor-pointer">
                          <MousePointer className="h-5 w-5 text-primary" />
                          <span className="font-medium">Clicks</span>
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Drive traffic to your profile or website. Best for conversions.
                        </p>
                        <p className="text-xs text-primary mt-2">~20 clicks per ₦1,000</p>
                      </div>
                    </div>

                    <div 
                      className={`flex items-start space-x-4 p-4 rounded-lg border cursor-pointer transition-colors ${goal === 'engagement' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                      onClick={() => setGoal('engagement')}
                    >
                      <RadioGroupItem value="engagement" id="engagement" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="engagement" className="flex items-center gap-2 cursor-pointer">
                          <Heart className="h-5 w-5 text-primary" />
                          <span className="font-medium">Engagement</span>
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Get more likes, comments, and shares. Best for growth.
                        </p>
                        <p className="text-xs text-primary mt-2">~40 engagements per ₦1,000</p>
                      </div>
                    </div>
                  </RadioGroup>

                  {budget && Number(budget) >= 1000 && (
                    <Card className="bg-muted/50">
                      <CardContent className="py-4">
                        <h4 className="font-medium mb-2">Estimated Results</h4>
                        <div className="flex items-center gap-2 text-primary">
                          {getGoalIcon(goal)}
                          <span className="text-lg font-bold">
                            {goal === 'views' && `~${Math.floor(Number(budget) / 10).toLocaleString()} views`}
                            {goal === 'clicks' && `~${Math.floor(Number(budget) / 50).toLocaleString()} clicks`}
                            {goal === 'engagement' && `~${Math.floor(Number(budget) / 25).toLocaleString()} engagements`}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="my-promotions">
            <Card>
              <CardHeader>
                <CardTitle>My Promotions</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  </div>
                ) : promotions.length === 0 ? (
                  <div className="text-center py-8">
                    <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No promotions yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Create your first promotion to start reaching more people
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {promotions.map((promo) => (
                      <div key={promo.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{promo.title}</h4>
                            <a 
                              href={promo.video_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              <LinkIcon className="h-3 w-3" />
                              View Video
                            </a>
                          </div>
                          <Badge className={getStatusColor(promo.status)}>
                            {promo.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Budget</p>
                            <p className="font-medium">₦{promo.budget.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Goal</p>
                            <p className="font-medium capitalize flex items-center gap-1">
                              {getGoalIcon(promo.goal)}
                              {promo.goal}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Spent</p>
                            <p className="font-medium">₦{(promo.spent_amount || 0).toLocaleString()}</p>
                          </div>
                        </div>

                        {promo.status === 'active' && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="text-primary font-medium">
                                {promo.goal === 'views' && `${promo.achieved_views || 0}/${promo.target_views || 0} views`}
                                {promo.goal === 'clicks' && `${promo.achieved_clicks || 0}/${promo.target_clicks || 0} clicks`}
                                {promo.goal === 'engagement' && `${promo.achieved_engagement || 0}/${promo.target_engagement || 0} engagements`}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <MobileNavigation />
    </div>
  );
}