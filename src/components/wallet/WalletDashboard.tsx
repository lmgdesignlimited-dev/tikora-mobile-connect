import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

export function WalletDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState([]);
  const [fundAmount, setFundAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTransactions();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleFundWallet = async () => {
    if (!fundAmount || isNaN(Number(fundAmount))) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      // Create a pending transaction
      const { data: transaction, error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user?.id,
          transaction_type: 'deposit',
          amount: Number(fundAmount),
          description: 'Wallet funding via payment gateway',
          payment_method: 'korapay', // Default to KoraPay
          status: 'pending',
          reference_id: `TIK${Date.now()}${Math.random().toString(36).substr(2, 9)}`
        })
        .select()
        .single();

      if (error) throw error;

      // TODO: Integrate with actual payment gateway (KoraPay/Flutterwave)
      // For now, simulate successful payment
      toast.success('Payment initiated! Please complete the payment process.');
      
      setFundAmount('');
      fetchTransactions();
    } catch (error) {
      console.error('Error funding wallet:', error);
      toast.error('Failed to initiate payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawFunds = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = Number(withdrawAmount);
    if (amount > (profile?.wallet_balance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    setIsLoading(true);
    try {
      // Create withdrawal transaction
      const { error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user?.id,
          transaction_type: 'withdrawal',
          amount: amount,
          description: 'Withdrawal to bank account',
          payment_method: 'bank_transfer',
          status: 'pending',
          reference_id: `TIK${Date.now()}${Math.random().toString(36).substr(2, 9)}`
        });

      if (error) throw error;

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          wallet_balance: (profile?.wallet_balance || 0) - amount 
        })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      toast.success('Withdrawal request submitted! Processing may take 1-3 business days.');
      
      setWithdrawAmount('');
      fetchProfile();
      fetchTransactions();
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      toast.error('Failed to process withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case 'payment':
        return <Minus className="h-4 w-4 text-warning" />;
      case 'commission':
      case 'refund':
        return <Plus className="h-4 w-4 text-success" />;
      default:
        return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'commission':
      case 'refund':
        return 'text-success';
      case 'withdrawal':
      case 'payment':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'failed':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          Wallet
        </h1>
        <p className="text-muted-foreground">
          Manage your funds and track transactions
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-primary to-primary-light text-white">
        <CardHeader>
          <CardTitle className="text-white/90">Wallet Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-4">
            ₦{(profile?.wallet_balance || 0).toLocaleString()}
          </div>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              size="sm"
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              Fund Wallet
            </Button>
            <Button 
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

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Fund Wallet */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-success" />
              Fund Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₦)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                min="100"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <CreditCard className="h-4 w-4 mr-2" />
                  KoraPay
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Flutterwave
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleFundWallet}
              disabled={isLoading || !fundAmount}
              className="w-full"
              variant="gradient"
            >
              {isLoading ? 'Processing...' : 'Fund Wallet'}
            </Button>
          </CardContent>
        </Card>

        {/* Withdraw Funds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Minus className="h-5 w-5 text-destructive" />
              Withdraw Funds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₦)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="100"
                max={profile?.wallet_balance || 0}
              />
              <p className="text-xs text-muted-foreground">
                Available: ₦{(profile?.wallet_balance || 0).toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Bank Account</Label>
              <div className="p-3 border rounded-lg bg-muted/50">
                <p className="text-sm font-medium">
                  {profile?.bank_account_name || 'No bank account added'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.bank_name} - {profile?.bank_account_number}
                </p>
              </div>
            </div>

            <Button 
              onClick={handleWithdrawFunds}
              disabled={isLoading || !withdrawAmount || !profile?.bank_account_number}
              className="w-full"
              variant="outline"
            >
              {isLoading ? 'Processing...' : 'Withdraw Funds'}
            </Button>
          </CardContent>
        </Card>
      </div>

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
              {transactions.map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div>
                      <p className="font-medium text-sm">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()} •{' '}
                        {transaction.reference_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                      {['withdrawal', 'payment'].includes(transaction.transaction_type) ? '-' : '+'}
                      ₦{transaction.amount.toLocaleString()}
                    </p>
                    <Badge className={getStatusColor(transaction.status)} variant="outline">
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}