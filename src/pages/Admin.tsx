import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Header } from '@/components/layout/Header';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { AdminStats, AdminCoinPanel, ModerationQueue, UserManagement, AdminActivityLog } from '@/components/admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  Coins, 
  Users, 
  BarChart3,
  Video,
  Activity,
  Crown,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { roles, hasAnyAdminRole, isAdmin, isModerator, isAnalyst, loading: roleLoading, bootstrapAdmin } = useAdminRole();
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapAttempted, setBootstrapAttempted] = useState(false);

  // Attempt to bootstrap admin on first load if user has no admin role
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

  if (authLoading || roleLoading || isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">
            {isBootstrapping ? 'Setting up admin access...' : 'Loading...'}
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
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 pb-20">
          <Card className="max-w-md mx-auto mt-12">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                You don't have permission to access the admin panel.
              </p>
              <div className="grid gap-2">
                <Button
                  variant="outline"
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
                <Button variant="outline" asChild>
                  <Link to="/dashboard">Return to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <MobileNavigation />
      </div>
    );
  }

  const getRoleBadge = () => {
    if (isAdmin) return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Admin</Badge>;
    if (isModerator) return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Moderator</Badge>;
    if (isAnalyst) return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Analyst</Badge>;
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
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
              <span className="hidden xs:inline">Overview</span>
              <span className="xs:hidden">Stats</span>
            </TabsTrigger>
            {(isAdmin || isModerator) && (
              <TabsTrigger value="moderation" className="gap-1.5 flex-1 min-w-[80px] text-xs sm:text-sm">
                <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Moderation</span>
                <span className="xs:hidden">Mod</span>
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
              <span className="hidden xs:inline">Activity</span>
              <span className="xs:hidden">Log</span>
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
