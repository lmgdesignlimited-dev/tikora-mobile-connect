import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Briefcase, 
  Video, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign
} from 'lucide-react';

interface DashboardStats {
  total_users: number;
  active_users: number;
  total_campaigns: number;
  active_campaigns: number;
  pending_submissions: number;
  approved_submissions: number;
  rejected_submissions: number;
  total_applications: number;
  pending_applications: number;
  platform_revenue: number;
  user_breakdown: Record<string, number>;
}

export function AdminStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
      
      if (error) throw error;
      
      const result = data as Record<string, unknown>;
      if (result?.error) {
        console.error('Unauthorized');
        return;
      }
      
      setStats(result as unknown as DashboardStats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.total_users,
      icon: Users,
      color: 'text-blue-500',
      subtitle: `${stats.active_users} active`
    },
    {
      title: 'Active Campaigns',
      value: stats.active_campaigns,
      icon: Briefcase,
      color: 'text-green-500',
      subtitle: `${stats.total_campaigns} total`
    },
    {
      title: 'Pending Reviews',
      value: stats.pending_submissions,
      icon: Clock,
      color: 'text-yellow-500',
      subtitle: 'Awaiting moderation'
    },
    {
      title: 'Approved',
      value: stats.approved_submissions,
      icon: CheckCircle,
      color: 'text-emerald-500',
      subtitle: 'Submissions'
    },
    {
      title: 'Rejected',
      value: stats.rejected_submissions,
      icon: XCircle,
      color: 'text-red-500',
      subtitle: 'Submissions'
    },
    {
      title: 'Applications',
      value: stats.total_applications,
      icon: TrendingUp,
      color: 'text-purple-500',
      subtitle: `${stats.pending_applications} pending`
    },
    {
      title: 'Revenue',
      value: `₦${stats.platform_revenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-primary',
      subtitle: 'Platform fees'
    },
    {
      title: 'Videos',
      value: stats.approved_submissions + stats.rejected_submissions + stats.pending_submissions,
      icon: Video,
      color: 'text-pink-500',
      subtitle: 'Total submissions'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Breakdown */}
      {stats.user_breakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">User Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(stats.user_breakdown).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm capitalize">{type}:</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
