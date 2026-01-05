import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Coins, 
  Zap, 
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { BuyCoinModal } from './BuyCoinModal';
import { ActivateBoostModal } from './ActivateBoostModal';

interface CoinWalletData {
  id: string;
  coin_balance: number;
  total_coins_purchased: number;
  total_coins_spent: number;
}

interface ActiveBoost {
  id: string;
  boost_type: string;
  coins_spent: number;
  boost_multiplier: number;
  expires_at: string;
}

export function CoinWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<CoinWalletData | null>(null);
  const [activeBoosts, setActiveBoosts] = useState<ActiveBoost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user?.id]);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      // Fetch or create wallet
      let { data: walletData, error } = await supabase
        .from('coin_wallets')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!walletData && !error) {
        // Create wallet if doesn't exist
        const { data: newWallet, error: createError } = await supabase
          .from('coin_wallets')
          .insert({ user_id: user?.id })
          .select()
          .single();

        if (createError) throw createError;
        walletData = newWallet;
      }

      if (error) throw error;
      setWallet(walletData);

      // Fetch active boosts
      const { data: boosts, error: boostError } = await supabase
        .from('influencer_boosts')
        .select('*')
        .eq('influencer_id', user?.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true });

      if (boostError) throw boostError;
      setActiveBoosts(boosts || []);
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return `${hours}h ${minutes}m remaining`;
  };

  const getBoostTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return 'Daily Boost';
      case 'weekly': return 'Weekly Boost';
      case 'campaign_specific': return 'Campaign Boost';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-12 bg-muted rounded w-1/2 mb-4" />
          <div className="h-8 bg-muted rounded w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <div className="text-white">
                <p className="text-sm opacity-80">Tikora Coins</p>
                <p className="text-3xl font-bold">{wallet?.coin_balance?.toLocaleString() || 0}</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowBuyModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              variant="outline"
            >
              Buy Coins
            </Button>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Purchased</p>
              <p className="text-lg font-semibold">{wallet?.total_coins_purchased?.toLocaleString() || 0}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Spent</p>
              <p className="text-lg font-semibold">{wallet?.total_coins_spent?.toLocaleString() || 0}</p>
            </div>
          </div>

          {/* Active Boosts */}
          {activeBoosts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Active Boosts
              </h4>
              {activeBoosts.map((boost) => (
                <div 
                  key={boost.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg border border-amber-200/50 dark:border-amber-800/50"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">{getBoostTypeLabel(boost.boost_type)}</p>
                      <p className="text-xs text-muted-foreground">
                        {boost.boost_multiplier}x visibility boost
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    <Clock className="h-3 w-3 mr-1" />
                    {getTimeRemaining(boost.expires_at)}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Boost CTA */}
          <Button 
            onClick={() => setShowBoostModal(true)}
            className="w-full gap-2"
            variant={activeBoosts.length > 0 ? 'outline' : 'gradient'}
          >
            <TrendingUp className="h-4 w-4" />
            {activeBoosts.length > 0 ? 'Add More Boosts' : 'Boost Your Visibility'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <BuyCoinModal 
        open={showBuyModal} 
        onOpenChange={setShowBuyModal}
        onSuccess={loadWalletData}
      />
      
      <ActivateBoostModal
        open={showBoostModal}
        onOpenChange={setShowBoostModal}
        coinBalance={wallet?.coin_balance || 0}
        onSuccess={loadWalletData}
      />
    </>
  );
}
