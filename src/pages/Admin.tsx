import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { AdminGuard } from '@/components/layout/AdminGuard';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { AdminStats, AdminCoinPanel, ModerationQueue, UserManagement, AdminActivityLog } from '@/components/admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Coins, Users, BarChart3, Video, Activity, ExternalLink } from 'lucide-react';

export default function Admin() {
  const { isAdmin, isModerator, isAnalyst } = useAdminRole();

  const getRoleBadge = () => {
    if (isAdmin) return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Admin</Badge>;
    if (isModerator) return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Moderator</Badge>;
    if (isAnalyst) return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Analyst</Badge>;
    return null;
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Shield className="h-6 w-6 text-primary shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold">Admin Panel</h1>
            {getRoleBadge()}
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/command" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Enterprise Command
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-1.5 flex-1 min-w-[80px] text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Overview
            </TabsTrigger>
            {(isAdmin || isModerator) && (
              <TabsTrigger value="moderation" className="gap-1.5 flex-1 min-w-[80px] text-xs sm:text-sm">
                <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Moderation
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="users" className="gap-1.5 flex-1 min-w-[80px] text-xs sm:text-sm">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Users
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="coins" className="gap-1.5 flex-1 min-w-[80px] text-xs sm:text-sm">
                <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Coins
              </TabsTrigger>
            )}
            <TabsTrigger value="activity" className="gap-1.5 flex-1 min-w-[80px] text-xs sm:text-sm">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><AdminStats /></TabsContent>
          {(isAdmin || isModerator) && <TabsContent value="moderation"><ModerationQueue /></TabsContent>}
          {isAdmin && <TabsContent value="users"><UserManagement /></TabsContent>}
          {isAdmin && <TabsContent value="coins"><AdminCoinPanel /></TabsContent>}
          <TabsContent value="activity"><AdminActivityLog /></TabsContent>
        </Tabs>
      </AdminLayout>
    </AdminGuard>
  );
}
