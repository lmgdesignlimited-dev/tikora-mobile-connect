import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Coins, 
  Clock,
  Eye,
  Target
} from 'lucide-react';

interface BoostHistory {
  id: string;
  boost_type: string;
  coins_spent: number;
  boost_multiplier: number;
  started_at: string;
  expires_at: string;
  is_active: boolean;
}

interface CoinTransaction {
  id: string;
  transaction_type: string;
  coin_amount: number;
  description: string;
  created_at: string;
}

export function BoostStats() {
  const { user } = useAuth();
  const [boostHistory, setBoostHistory] = useState<BoostHistory[]>([]);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user?.id]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [boostsRes, transactionsRes] = await Promise.all([
        supabase
          .from('influencer_boosts')
          .select('*')
          .eq('influencer_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('coin_transactions')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (boostsRes.data) setBoostHistory(boostsRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSpentOnBoosts = boostHistory.reduce((sum, b) => sum + b.coins_spent, 0);
  const activeBoosts = boostHistory.filter(b => b.is_active && new Date(b.expires_at) > new Date());

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Coins className="h-4 w-4 text-success" />;
      case 'boost_spend':
        return <TrendingUp className="h-4 w-4 text-primary" />;
      default:
        return <Coins className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-32 bg-muted rounded" />
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-32 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Active Boosts</span>
            </div>
            <p className="text-2xl font-bold">{activeBoosts.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Boosts</span>
            </div>
            <p className="text-2xl font-bold">{boostHistory.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Coins Spent</span>
            </div>
            <p className="text-2xl font-bold">{totalSpentOnBoosts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Visibility Impact</span>
            </div>
            <p className="text-2xl font-bold">
              {activeBoosts.length > 0 
                ? `${Math.max(...activeBoosts.map(b => b.boost_multiplier))}x`
                : '1x'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Boost History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Boost History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {boostHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No boosts activated yet
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {boostHistory.map((boost) => (
                  <div
                    key={boost.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`h-4 w-4 ${boost.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {boost.boost_type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(boost.started_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={boost.is_active ? 'default' : 'secondary'}>
                        {boost.is_active ? 'Active' : 'Expired'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {boost.coins_spent} coins
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coin Transactions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Coin Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(tx.transaction_type)}
                      <div>
                        <p className="text-sm font-medium">
                          {tx.description || tx.transaction_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.created_at)}
                        </p>
                      </div>
                    </div>
                    <p className={`font-semibold ${tx.coin_amount > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                      {tx.coin_amount > 0 ? '+' : ''}{tx.coin_amount}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
