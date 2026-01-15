import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Building,
} from 'lucide-react';
import { PaymentGatewayPanel } from '@/components/admin/PaymentGatewayPanel';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  status: string;
  description: string;
  created_at: string;
}

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  user_name?: string;
  bank_name?: string;
  account_number?: string;
}

const mockRevenueData = [
  { name: 'Jan', revenue: 240000, fees: 48000 },
  { name: 'Feb', revenue: 320000, fees: 64000 },
  { name: 'Mar', revenue: 280000, fees: 56000 },
  { name: 'Apr', revenue: 450000, fees: 90000 },
  { name: 'May', revenue: 520000, fees: 104000 },
  { name: 'Jun', revenue: 680000, fees: 136000 },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export default function CommandFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch recent transactions
      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setTransactions(txData || []);

      // Fetch pending withdrawals
      const { data: withdrawalData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('transaction_type', 'withdrawal')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setWithdrawals(withdrawalData || []);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('wallet_transactions')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Withdrawal approved');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve withdrawal');
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    try {
      // Get the transaction to get the amount and user_id
      const { data: tx } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (tx) {
        // Get current balance and refund
        const { data: profile } = await supabase
          .from('profiles')
          .select('wallet_balance')
          .eq('user_id', tx.user_id)
          .single();
        
        await supabase
          .from('profiles')
          .update({ wallet_balance: (profile?.wallet_balance || 0) + tx.amount })
          .eq('user_id', tx.user_id);
      }

      const { error } = await supabase
        .from('wallet_transactions')
        .update({ status: 'failed' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Withdrawal rejected and refunded');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject withdrawal');
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-success';
      case 'withdrawal':
        return 'text-destructive';
      case 'platform_fee':
        return 'text-primary';
      case 'payment':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const stats = {
    totalDeposits: transactions.filter(t => t.transaction_type === 'deposit' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
    totalWithdrawals: transactions.filter(t => t.transaction_type === 'withdrawal' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
    platformFees: transactions.filter(t => t.transaction_type === 'platform_fee').reduce((sum, t) => sum + t.amount, 0),
    pendingWithdrawals: withdrawals.length,
  };

  const pieData = [
    { name: 'Deposits', value: stats.totalDeposits },
    { name: 'Withdrawals', value: stats.totalWithdrawals },
    { name: 'Platform Fees', value: stats.platformFees },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              Finance Management
            </h1>
            <p className="text-muted-foreground">Track revenue, manage withdrawals, and configure payment gateways</p>
          </div>
          <Button onClick={fetchData} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="gateways">Payment Gateways</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Deposits</div>
                      <div className="text-2xl font-bold text-success">₦{stats.totalDeposits.toLocaleString()}</div>
                    </div>
                    <ArrowUpRight className="h-8 w-8 text-success/20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Withdrawals</div>
                      <div className="text-2xl font-bold text-destructive">₦{stats.totalWithdrawals.toLocaleString()}</div>
                    </div>
                    <ArrowDownRight className="h-8 w-8 text-destructive/20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Platform Fees</div>
                      <div className="text-2xl font-bold text-primary">₦{stats.platformFees.toLocaleString()}</div>
                    </div>
                    <DollarSign className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Pending Withdrawals</div>
                      <div className="text-2xl font-bold text-warning">{stats.pendingWithdrawals}</div>
                    </div>
                    <Clock className="h-8 w-8 text-warning/20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue and platform fees</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mockRevenueData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(var(--success))"
                          fill="url(#colorRevenue)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transaction Distribution</CardTitle>
                  <CardDescription>Breakdown by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    {pieData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                        <span className="text-sm text-muted-foreground">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 10).map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className={`font-medium capitalize ${getTransactionColor(tx.transaction_type)}`}>
                          {tx.transaction_type.replace('_', ' ')}
                        </TableCell>
                        <TableCell className={getTransactionColor(tx.transaction_type)}>
                          {tx.transaction_type === 'withdrawal' ? '-' : '+'}₦{tx.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{tx.description || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(tx.created_at), 'MMM d, HH:mm')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending Withdrawals</CardTitle>
                <CardDescription>Review and approve withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Bank Details</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No pending withdrawals
                        </TableCell>
                      </TableRow>
                    ) : (
                      withdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell className="font-medium">{withdrawal.user_name || withdrawal.user_id.slice(0, 8)}</TableCell>
                          <TableCell className="font-bold">₦{withdrawal.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {withdrawal.bank_name || 'Not specified'}
                          </TableCell>
                          <TableCell>{format(new Date(withdrawal.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-success hover:text-success"
                                onClick={() => handleApproveWithdrawal(withdrawal.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleRejectWithdrawal(withdrawal.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gateways">
            <PaymentGatewayPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
