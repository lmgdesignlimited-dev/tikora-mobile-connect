import { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  Video,
  FileCheck,
  Wallet,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Activity,
  Megaphone,
  Package,
  CreditCard,
  BarChart3,
  Bell,
  UserCog,
  Coins,
  Bitcoin,
  AlertTriangle,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  roles?: string[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/command' },
  { icon: BarChart3, label: 'Analytics', href: '/command/analytics', roles: ['admin', 'super_admin', 'analyst'] },
  { 
    icon: Video, 
    label: 'Content Moderation', 
    href: '/command/moderation',
    roles: ['admin', 'super_admin', 'moderator'],
  },
  { 
    icon: Megaphone, 
    label: 'Promotions', 
    href: '/command/promotions',
    roles: ['admin', 'super_admin', 'operations'],
  },
  { 
    icon: Package, 
    label: 'Services', 
    href: '/command/services',
    roles: ['admin', 'super_admin', 'operations', 'support'],
  },
  { 
    icon: FileCheck, 
    label: 'Campaigns', 
    href: '/command/campaigns',
    roles: ['admin', 'super_admin', 'operations'],
  },
  { icon: Users, label: 'Users', href: '/command/users', roles: ['admin', 'super_admin'] },
  { 
    icon: Wallet, 
    label: 'Finance', 
    href: '/command/finance',
    roles: ['admin', 'super_admin', 'finance'],
  },
  { 
    icon: CreditCard, 
    label: 'Pricing', 
    href: '/command/pricing',
    roles: ['admin', 'super_admin'],
  },
  { 
    icon: Bitcoin, 
    label: 'Crypto', 
    href: '/command/crypto',
    roles: ['admin', 'super_admin', 'finance'],
  },
  { 
    icon: Coins, 
    label: 'Coins & Boosts', 
    href: '/command/coins',
    roles: ['admin', 'super_admin'],
  },
  { 
    icon: UserCog, 
    label: 'Role Management', 
    href: '/command/roles',
    roles: ['admin', 'super_admin'],
  },
  { icon: Activity, label: 'Activity Logs', href: '/command/activity' },
  { 
    icon: Settings, 
    label: 'Settings', 
    href: '/command/settings',
    roles: ['admin', 'super_admin'],
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut, loading: authLoading } = useAuth();
  const { roles, isAdmin, isSuperAdmin, hasAnyAdminRole, loading: roleLoading } = useAdminRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  if (!hasAnyAdminRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access the admin area. Contact your administrator.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" asChild className="w-full">
              <Link to="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getRoleBadge = () => {
    if (isSuperAdmin) return { label: 'Super Admin', color: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' };
    if (isAdmin) return { label: 'Admin', color: 'bg-destructive/20 text-destructive' };
    if (roles.includes('finance')) return { label: 'Finance', color: 'bg-emerald-500/20 text-emerald-500' };
    if (roles.includes('moderator')) return { label: 'Moderator', color: 'bg-purple-500/20 text-purple-500' };
    if (roles.includes('operations')) return { label: 'Operations', color: 'bg-blue-500/20 text-blue-500' };
    if (roles.includes('analyst')) return { label: 'Analyst', color: 'bg-cyan-500/20 text-cyan-500' };
    if (roles.includes('support')) return { label: 'Support', color: 'bg-pink-500/20 text-pink-500' };
    return null;
  };

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(role => roles.includes(role as any));
  });

  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center px-4">
        <div className="flex items-center gap-4 w-full">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <Link to="/command" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg">Tikora</span>
              <span className="text-xs text-muted-foreground ml-1">Command</span>
            </div>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold flex items-center justify-center text-destructive-foreground">
              3
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-auto py-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {user?.email?.split('@')[0]}
                  </span>
                  {roleBadge && (
                    <Badge className={cn('text-[10px] h-4 px-1', roleBadge.color)}>
                      {roleBadge.label}
                    </Badge>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard" className="cursor-pointer">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  User Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 bottom-0 w-64 bg-card border-r border-border z-40 transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <ScrollArea className="h-full py-4">
          <nav className="px-3 space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/command' && location.pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          <Separator className="my-4" />

          {/* Quick Stats */}
          <div className="px-4 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Stats
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending Reviews</span>
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                  12
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Promotions</span>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  8
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Service Orders</span>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  5
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* System Status */}
          <div className="px-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>All systems operational</span>
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="pt-16 lg:pl-64 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
