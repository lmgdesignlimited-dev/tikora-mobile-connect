import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Star,
  Wallet,
  Ban,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Shield,
  Edit,
  DollarSign,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  user_type: string;
  is_active: boolean;
  verification_status: string;
  influencer_tier: string | null;
  influencer_category: string | null;
  rating: number;
  completed_campaigns: number;
  strike_count: number;
  wallet_balance: number;
  total_earnings: number;
  total_spent: number;
  follower_count: number;
  following_count: number;
  city: string | null;
  country: string | null;
  location: string | null;
  bio: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  platforms: string[] | null;
  completion_rate: number;
  created_at: string;
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string | null;
  status: string | null;
  created_at: string;
}

interface Campaign {
  id: string;
  title: string;
  campaign_type: string;
  status: string | null;
  budget: number;
  created_at: string;
}

interface UserProfileDrawerProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function UserProfileDrawer({ userId, open, onOpenChange, onUpdate }: UserProfileDrawerProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [adjustWalletOpen, setAdjustWalletOpen] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletNote, setWalletNote] = useState('');
  const [walletOp, setWalletOp] = useState<'add' | 'subtract'>('add');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userId && open) {
      fetchData(userId);
    }
  }, [userId, open]);

  const fetchData = async (uid: string) => {
    setLoading(true);
    try {
      const [profileRes, txRes, campaignRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', uid).single(),
        supabase.from('wallet_transactions').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(20),
        supabase.from('campaigns').select('id,title,campaign_type,status,budget,created_at').eq('creator_id', uid).order('created_at', { ascending: false }).limit(20),
      ]);

      if (profileRes.data) setProfile(profileRes.data as UserProfile);
      if (txRes.data) setTransactions(txRes.data);
      if (campaignRes.data) setCampaigns(campaignRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ verification_status: 'verified' }).eq('user_id', profile.user_id);
    setSaving(false);
    if (error) { toast.error('Failed'); return; }
    toast.success('User verified');
    fetchData(profile.user_id);
    onUpdate();
  };

  const handleToggleActive = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ is_active: !profile.is_active }).eq('user_id', profile.user_id);
    setSaving(false);
    if (error) { toast.error('Failed'); return; }
    toast.success(`User ${profile.is_active ? 'suspended' : 'activated'}`);
    fetchData(profile.user_id);
    onUpdate();
  };

  const handleAddStrike = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ strike_count: (profile.strike_count || 0) + 1 }).eq('user_id', profile.user_id);
    setSaving(false);
    if (error) { toast.error('Failed'); return; }
    toast.success('Strike added');
    fetchData(profile.user_id);
    onUpdate();
  };

  const handleWalletAdjust = async () => {
    if (!profile || !walletAmount) return;
    const amount = parseFloat(walletAmount);
    if (isNaN(amount) || amount <= 0) { toast.error('Invalid amount'); return; }
    setSaving(true);
    const newBalance = walletOp === 'add'
      ? (profile.wallet_balance || 0) + amount
      : Math.max(0, (profile.wallet_balance || 0) - amount);

    const { error } = await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('user_id', profile.user_id);
    if (!error) {
      await supabase.from('wallet_transactions').insert({
        user_id: profile.user_id,
        transaction_type: walletOp === 'add' ? 'admin_credit' : 'admin_debit',
        amount: amount,
        description: walletNote || `Admin ${walletOp === 'add' ? 'credit' : 'debit'}`,
        status: 'completed',
      });
    }
    setSaving(false);
    if (error) { toast.error('Failed'); return; }
    toast.success(`Wallet ${walletOp === 'add' ? 'credited' : 'debited'}`);
    setAdjustWalletOpen(false);
    setWalletAmount('');
    setWalletNote('');
    fetchData(profile.user_id);
    onUpdate();
  };

  if (!profile) return null;

  const tierColor: Record<string, string> = {
    super: 'bg-amber-500/10 text-amber-500',
    top: 'bg-purple-500/10 text-purple-500',
    mid: 'bg-blue-500/10 text-blue-500',
    starter: 'bg-muted text-muted-foreground',
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>User Profile</SheetTitle>
          </SheetHeader>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xl">{profile.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold">{profile.full_name}</h2>
                    {!profile.is_active && <Badge variant="destructive">Suspended</Badge>}
                  </div>
                  {profile.username && <p className="text-muted-foreground">@{profile.username}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={profile.user_type === 'influencer' ? 'bg-purple-500/10 text-purple-500' : profile.user_type === 'artist' ? 'bg-pink-500/10 text-pink-500' : 'bg-blue-500/10 text-blue-500'}>
                      {profile.user_type}
                    </Badge>
                    {profile.influencer_tier && (
                      <Badge className={tierColor[profile.influencer_tier] || 'bg-muted text-muted-foreground'}>
                        {profile.influencer_tier} tier
                      </Badge>
                    )}
                    <Badge className={profile.verification_status === 'verified' ? 'bg-green-500/10 text-green-500' : 'bg-warning/10 text-warning'}>
                      {profile.verification_status}
                    </Badge>
                    {profile.strike_count > 0 && (
                      <Badge variant="destructive">{profile.strike_count} strike{profile.strike_count > 1 ? 's' : ''}</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="flex flex-wrap gap-2">
                {profile.verification_status !== 'verified' && (
                  <Button size="sm" onClick={handleVerify} disabled={saving} className="gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Verify
                  </Button>
                )}
                <Button size="sm" variant={profile.is_active ? 'destructive' : 'default'} onClick={handleToggleActive} disabled={saving} className="gap-1">
                  {profile.is_active ? <><Ban className="h-3.5 w-3.5" /> Suspend</> : <><CheckCircle className="h-3.5 w-3.5" /> Activate</>}
                </Button>
                <Button size="sm" variant="outline" onClick={handleAddStrike} disabled={saving} className="gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Add Strike
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAdjustWalletOpen(true)} className="gap-1">
                  <Wallet className="h-3.5 w-3.5" /> Adjust Wallet
                </Button>
              </div>

              <Separator />

              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Wallet', value: `₦${(profile.wallet_balance || 0).toLocaleString()}`, icon: Wallet },
                  { label: 'Total Earned', value: `₦${(profile.total_earnings || 0).toLocaleString()}`, icon: DollarSign },
                  { label: 'Campaigns', value: profile.completed_campaigns || 0, icon: TrendingUp },
                  { label: 'Rating', value: `${(profile.rating || 0).toFixed(1)} ★`, icon: Star },
                ].map(({ label, value, icon: Icon }) => (
                  <Card key={label}>
                    <CardContent className="p-3 text-center">
                      <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-lg font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Tabs */}
              <Tabs defaultValue="info">
                <TabsList className="w-full">
                  <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                  <TabsTrigger value="transactions" className="flex-1">Transactions</TabsTrigger>
                  <TabsTrigger value="campaigns" className="flex-1">Campaigns</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-3 mt-4">
                  {[
                    { icon: Mail, label: 'Email', value: profile.email },
                    { icon: Phone, label: 'Phone', value: profile.phone },
                    { icon: MapPin, label: 'Location', value: [profile.city, profile.country].filter(Boolean).join(', ') || profile.location },
                    { icon: Calendar, label: 'Joined', value: format(new Date(profile.created_at), 'MMM d, yyyy') },
                    { icon: Users, label: 'Followers', value: `${profile.follower_count || 0} followers · ${profile.following_count || 0} following` },
                    { icon: TrendingUp, label: 'Completion Rate', value: `${(profile.completion_rate || 0).toFixed(0)}%` },
                  ].map(({ icon: Icon, label, value }) => value ? (
                    <div key={label} className="flex items-center gap-3 text-sm">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground w-28 shrink-0">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ) : null)}
                  {profile.bio && (
                    <div className="flex items-start gap-3 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-muted-foreground w-28 shrink-0">Bio</span>
                      <span>{profile.bio}</span>
                    </div>
                  )}
                  {profile.bank_name && (
                    <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                      <p className="font-medium">Bank Details</p>
                      <p className="text-muted-foreground">{profile.bank_name} · {profile.bank_account_number}</p>
                    </div>
                  )}
                  {profile.platforms && profile.platforms.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">Platforms:</span>
                      {profile.platforms.map(p => <Badge key={p} variant="outline">{p}</Badge>)}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="transactions" className="mt-4">
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {transactions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No transactions</p>
                    ) : transactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                        <div>
                          <p className="font-medium capitalize">{tx.transaction_type.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">{tx.description || '—'}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${['deposit','admin_credit','earning'].includes(tx.transaction_type) ? 'text-green-500' : 'text-destructive'}`}>
                            {['deposit','admin_credit','earning'].includes(tx.transaction_type) ? '+' : '-'}₦{tx.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), 'MMM d')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="campaigns" className="mt-4">
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {campaigns.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No campaigns created</p>
                    ) : campaigns.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                        <div>
                          <p className="font-medium">{c.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{c.campaign_type.replace('_', ' ')}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs mb-1">{c.status}</Badge>
                          <p className="text-xs text-muted-foreground">₦{c.budget.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Adjust Wallet Dialog */}
      <Dialog open={adjustWalletOpen} onOpenChange={setAdjustWalletOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Wallet Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Current balance: <strong>₦{(profile?.wallet_balance || 0).toLocaleString()}</strong></p>
            <div className="flex gap-2">
              <Button variant={walletOp === 'add' ? 'default' : 'outline'} onClick={() => setWalletOp('add')} className="flex-1">Credit (+)</Button>
              <Button variant={walletOp === 'subtract' ? 'destructive' : 'outline'} onClick={() => setWalletOp('subtract')} className="flex-1">Debit (-)</Button>
            </div>
            <div className="space-y-2">
              <Label>Amount (₦)</Label>
              <Input type="number" placeholder="0" value={walletAmount} onChange={e => setWalletAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea placeholder="Reason for adjustment..." value={walletNote} onChange={e => setWalletNote(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustWalletOpen(false)}>Cancel</Button>
            <Button onClick={handleWalletAdjust} disabled={saving || !walletAmount}>
              {saving ? 'Saving...' : 'Apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
