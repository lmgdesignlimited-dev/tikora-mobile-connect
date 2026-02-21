import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Gift, Copy, Users, DollarSign } from 'lucide-react';

export function ReferralCard() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);

  useEffect(() => {
    if (user) fetchReferralData();
  }, [user?.id]);

  const fetchReferralData = async () => {
    if (!user) return;
    
    const [profileRes, referralsRes] = await Promise.all([
      supabase.from('profiles').select('referral_code').eq('user_id', user.id).maybeSingle(),
      supabase.from('referrals').select('id, commission_amount, commission_paid').eq('referrer_id', user.id),
    ]);

    if (profileRes.data?.referral_code) setReferralCode(profileRes.data.referral_code);
    if (referralsRes.data) {
      setReferralCount(referralsRes.data.length);
      setTotalEarned(referralsRes.data.filter(r => r.commission_paid).reduce((s, r) => s + (r.commission_amount || 0), 0));
    }
  };

  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  if (!referralCode) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          Referral Program
          <Badge variant="outline" className="ml-auto text-xs">5% Commission</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={referralLink} readOnly className="text-xs bg-muted/50" />
          <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0 gap-1">
            <Copy className="h-3 w-3" />Copy
          </Button>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{referralCount} referred</span>
          <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />₦{totalEarned.toLocaleString()} earned</span>
        </div>
      </CardContent>
    </Card>
  );
}
