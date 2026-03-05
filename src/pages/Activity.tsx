import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserLayout } from '@/components/layout/UserLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCircle, Clock, DollarSign, Video, AlertCircle, FileCheck, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data: any;
}

export default function Activity() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) fetchActivityData();
  }, [user]);

  const fetchActivityData = async () => {
    setLoadingData(true);
    try {
      const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(20);
      setNotifications(notifs || []);

      const { data: submissions } = await supabase.from('video_submissions').select('*').eq('influencer_id', user?.id).order('created_at', { ascending: false }).limit(10);
      const { data: applications } = await supabase.from('campaign_applications').select('*').eq('influencer_id', user?.id).order('created_at', { ascending: false }).limit(10);

      const combined = [
        ...(submissions || []).map(s => ({ ...s, activityType: 'submission' })),
        ...(applications || []).map(a => ({ ...a, activityType: 'application' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentActivity(combined.slice(0, 15));
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
  };

  const getActivityIcon = (type: string, status?: string) => {
    if (type === 'submission') {
      if (status === 'approved') return <CheckCircle className="h-5 w-5 text-success" />;
      if (status === 'rejected') return <AlertCircle className="h-5 w-5 text-destructive" />;
      return <Video className="h-5 w-5 text-primary" />;
    }
    if (type === 'application') {
      if (status === 'approved') return <FileCheck className="h-5 w-5 text-success" />;
      if (status === 'rejected') return <AlertCircle className="h-5 w-5 text-destructive" />;
      return <Clock className="h-5 w-5 text-warning" />;
    }
    return <Bell className="h-5 w-5" />;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarSign className="h-5 w-5 text-success" />;
      case 'approval': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'rejection': return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'application': return <UserPlus className="h-5 w-5 text-primary" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6 text-primary" />Activity</h1>
            <p className="text-muted-foreground">Your notifications and recent activity</p>
          </div>
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount} unread</Badge>}
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Activity</TabsTrigger>
            <TabsTrigger value="notifications">
              Notifications
              {unreadCount > 0 && <span className="ml-1 text-xs bg-destructive text-destructive-foreground rounded-full px-1.5">{unreadCount}</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {loadingData ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>
            ) : recentActivity.length === 0 ? (
              <Card><CardContent className="py-8 text-center"><Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No recent activity</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <Card key={activity.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getActivityIcon(activity.activityType, activity.status)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{activity.activityType === 'submission' ? 'Video Submission' : 'Campaign Application'}</p>
                          <p className="text-sm text-muted-foreground truncate">{activity.video_url || activity.proposal || 'No details'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{activity.status || 'pending'}</Badge>
                            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            {notifications.length === 0 ? (
              <Card><CardContent className="py-8 text-center"><Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No notifications yet</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card key={notification.id} className={notification.is_read ? 'opacity-75' : 'border-primary/30'} onClick={() => markAsRead(notification.id)}>
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{notification.title}</p>
                            {!notification.is_read && <div className="w-2 h-2 bg-primary rounded-full" />}
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  );
}
