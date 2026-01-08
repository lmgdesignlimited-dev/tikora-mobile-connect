import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Header } from '@/components/layout/Header';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { AdminStats, AdminCoinPanel, ModerationQueue, UserManagement, AdminActivityLog } from '@/components/admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Coins, 
  Users, 
  BarChart3,
  Video,
  Activity
} from 'lucide-react';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { roles, hasAnyAdminRole, isAdmin, isModerator, isAnalyst, loading: roleLoading } = useAdminRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasAnyAdminRole) {
    return <Navigate to="/dashboard" replace />;
  }

  const getRoleBadge = () => {
    if (isAdmin) return <Badge className="bg-red-500/10 text-red-500">Admin</Badge>;
    if (isModerator) return <Badge className="bg-purple-500/10 text-purple-500">Moderator</Badge>;
    if (isAnalyst) return <Badge className="bg-blue-500/10 text-blue-500">Analyst</Badge>;
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            {getRoleBadge()}
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            {(isAdmin || isModerator) && (
              <TabsTrigger value="moderation" className="gap-2">
                <Video className="h-4 w-4" />
                Moderation
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="coins" className="gap-2">
                <Coins className="h-4 w-4" />
                Coins & Boosts
              </TabsTrigger>
            )}
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminStats />
          </TabsContent>

          {(isAdmin || isModerator) && (
            <TabsContent value="moderation">
              <ModerationQueue />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="coins">
              <AdminCoinPanel />
            </TabsContent>
          )}

          <TabsContent value="activity">
            <AdminActivityLog />
          </TabsContent>
        </Tabs>
      </main>

      <MobileNavigation />
    </div>
  );
}
