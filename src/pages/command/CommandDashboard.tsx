import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Users,
  Video,
  Megaphone,
  Package,
  Wallet,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Activity,
  Crown,
  Shield,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DashboardStats {
  total_users: number;
  active_users: number;
  total_campaigns: number;
  active_campaigns: number;
  pending_submissions: number;
  approved_submissions: number;
  rejected_submissions: number;
  platform_revenue: number;
  user_breakdown: Record<string, number>;
}

const mockChartData = [
  { name: 'Jan', users: 400, revenue: 24000 },
  { name: 'Feb', users: 500, revenue: 32000 },
  { name: 'Mar', users: 600, revenue: 28000 },
  { name: 'Apr', users: 780, revenue: 45000 },
  { name: 'May', users: 890, revenue: 52000 },
  { name: 'Jun', users: 1200, revenue: 68000 },
];

export default function CommandDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { hasAnyAdminRole, loading: roleLoading, bootstrapAdmin, isSuperAdmin } = useAdminRole();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapAttempted, setBootstrapAttempted] = useState(false);

  useEffect(() => {
    const tryBootstrap = async () => {
      if (!roleLoading && !hasAnyAdminRole && user && !bootstrapAttempted) {
        setBootstrapAttempted(true);
        setIsBootstrapping(true);
        const success = await bootstrapAdmin();
        setIsBootstrapping(false);
        if (success) {
          toast.success('You are now the first admin!');
        }
      }
    };
    tryBootstrap();
  }, [roleLoading, hasAnyAdminRole, user, bootstrapAttempted, bootstrapAdmin]);

  useEffect(() => {
    if (hasAnyAdminRole) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [hasAnyAdminRole]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
      if (error) throw error;
      setStats(data as unknown as DashboardStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || roleLoading || isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isBootstrapping ? 'Setting up admin access...' : 'Loading Command Center...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasAnyAdminRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the Command Center.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                setIsBootstrapping(true);
                const success = await bootstrapAdmin();
                setIsBootstrapping(false);
                if (success) toast.success('Admin access granted (first admin)');
                else toast.error('Bootstrap failed: an admin already exists or access is restricted.');
              }}
            >
              Try First-Admin Bootstrap
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href="/dashboard">Return to Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Crown className="h-7 w-7 text-primary" />
              Command Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back. Here's what's happening with Tikora today.
            </p>
          </div>
          <Button className="hidden sm:flex gap-2">
            <Activity className="h-4 w-4" />
            View Reports
          </Button>
        </div>

        {/* Alert Banner */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
          <AlertCircle className="h-5 w-5 text-warning shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Attention Required</p>
            <p className="text-sm text-muted-foreground">
              12 video submissions are pending review. 3 service orders need processing.
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0">
            Review Now
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
                <div className="flex items-center gap-1 text-xs text-success mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+12.5%</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold">{stats?.active_campaigns || 0}</p>
                <div className="flex items-center gap-1 text-xs text-success mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+8.2%</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <Video className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
                <p className="text-2xl font-bold">{stats?.pending_submissions || 0}</p>
                <div className="flex items-center gap-1 text-xs text-warning mt-1">
                  <Clock className="h-3 w-3" />
                  <span>Needs attention</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Platform Revenue</p>
                <p className="text-2xl font-bold">₦{(stats?.platform_revenue || 0).toLocaleString()}</p>
                <div className="flex items-center gap-1 text-xs text-success mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+23.1%</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Growth</CardTitle>
            <CardDescription>Monthly user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
                    dataKey="users"
                    stroke="hsl(var(--primary))"
                    fill="url(#colorUsers)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Overview</CardTitle>
            <CardDescription>Monthly platform revenue in NGN</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockChartData}>
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
                  <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { icon: CheckCircle, color: 'text-success', text: 'Video submission approved for "Summer Vibes" campaign', time: '5 min ago' },
                { icon: Users, color: 'text-primary', text: 'New influencer registered: @musiclover234', time: '12 min ago' },
                { icon: Wallet, color: 'text-emerald-500', text: 'Withdrawal of ₦50,000 approved', time: '25 min ago' },
                { icon: AlertCircle, color: 'text-warning', text: 'Service order pending: TikTok Artist Claim', time: '1 hour ago' },
                { icon: Megaphone, color: 'text-purple-500', text: 'New video promotion created: "Brand Launch"', time: '2 hours ago' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`mt-0.5 ${activity.color}`}>
                    <activity.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Video className="h-4 w-4" />
              Review Submissions
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Package className="h-4 w-4" />
              Process Orders
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Wallet className="h-4 w-4" />
              Approve Withdrawals
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Megaphone className="h-4 w-4" />
              Manage Promotions
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Users className="h-4 w-4" />
              User Management
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
