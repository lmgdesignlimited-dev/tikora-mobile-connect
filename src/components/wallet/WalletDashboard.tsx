import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FundWalletModal } from './FundWalletModal';
import { WithdrawModal } from './WithdrawModal';
import { 
  Wallet, 
  Plus, 
  Minus, 
  ArrowUpRight,
  ArrowDownLeft,
  History,
  DollarSign
} from 'lucide-react';

export function WalletDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const [profileRes, txRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user?.id).maybeSingle(),
      supabase.from('wallet_transactions').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(20),
    ]);
    if (profileRes.data) setProfile(profileRes.data);
    if (txRes.data) setTransactions(txRes.data);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'commission':
      case 'refund':
        return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case 'withdrawal':
      case 'payment':
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      default:
        return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string) => {
    return ['deposit', 'commission', 'refund'].includes(type) ? 'text-success' : 'text-destructive';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'failed': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          Wallet
        </h1>
        <p className="text-muted-foreground">Manage your funds and track transactions</p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-white">
        <CardHeader>
          <CardTitle className="text-white/90">Wallet Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-4">
            ₦{(profile?.wallet_balance || 0).toLocaleString()}
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setFundModalOpen(true)}
              variant="secondary" 
              size="sm"
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              Fund Wallet
            </Button>
            <Button 
              onClick={() => setWithdrawModalOpen(true)}
              variant="secondary" 
              size="sm"
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              <Minus className="h-4 w-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(tx.transaction_type)}
                    <div>
                      <p className="font-medium text-sm">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()} • {tx.reference_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${getTransactionColor(tx.transaction_type)}`}>
                      {['withdrawal', 'payment'].includes(tx.transaction_type) ? '-' : '+'}
                      ₦{tx.amount.toLocaleString()}
                    </p>
                    <Badge className={getStatusColor(tx.status)} variant="outline">
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <FundWalletModal open={fundModalOpen} onOpenChange={setFundModalOpen} onSuccess={fetchData} />
      <WithdrawModal
        open={withdrawModalOpen}
        onOpenChange={setWithdrawModalOpen}
        onSuccess={fetchData}
        walletBalance={profile?.wallet_balance || 0}
        bankDetails={{
          bank_name: profile?.bank_name,
          bank_account_number: profile?.bank_account_number,
          bank_account_name: profile?.bank_account_name,
        }}
      />
    </div>
  );
}
