import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import { MobileNavigation } from './MobileNavigation';
import { NotificationDropdown } from '@/components/notifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import tikoraIcon from '@/assets/tikora-icon.png';
import {
  Home,
  Search,
  Plus,
  Heart,
  User,
  Wallet,
  Megaphone,
  Sparkles,
  Menu,
  X,
  LogOut,
  Shield,
  ChevronRight,
} from 'lucide-react';

interface UserLayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
}

const sidebarNav = [
  { icon: Home, label: 'Dashboard', to: '/dashboard' },
  { icon: Search, label: 'Explore', to: '/explore' },
  { icon: Plus, label: 'Create Campaign', to: '/create' },
  { icon: Heart, label: 'Activity', to: '/activity' },
  { icon: Wallet, label: 'Wallet', to: '/wallet' },
  { icon: Megaphone, label: 'Promote Video', to: '/promote' },
  { icon: Sparkles, label: 'Services', to: '/services' },
  { icon: User, label: 'Profile', to: '/profile' },
];

export function UserLayout({ children }: UserLayoutProps) {
  const { user, signOut } = useAuth();
  const { hasAnyAdminRole } = useAdminRole();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('profiles')
        .select('full_name, avatar_url, wallet_balance, user_type')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => setProfile(data));
    }
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
  };

  const userTypeLabel = (type: string | null) => {
    switch (type) {
      case 'artist': return '🎵 Artist';
      case 'influencer': return '📸 Creator';
      case 'business': return '🏢 Business';
      default: return 'Member';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/60">
        <div className="flex items-center h-14 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <Link to="/" className="flex items-center gap-2.5 mr-4">
            <img src={tikoraIcon} alt="Tikora" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-lg text-foreground hidden sm:block">Tikora</span>
          </Link>

          <div className="flex-1" />

          <Button variant="outline" size="sm" className="hidden sm:flex gap-2 mr-2 border-primary/20 hover:border-primary/40" asChild>
            <Link to="/wallet">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="font-semibold">₦{(profile?.wallet_balance || 0).toLocaleString()}</span>
            </Link>
          </Button>

          <NotificationDropdown />

          <Link to="/profile" className="ml-2">
            <Avatar className="h-8 w-8 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
              <AvatarImage src={profile?.avatar_url} alt="Profile" />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-14 left-0 bottom-0 w-64 bg-card/95 backdrop-blur-md border-r border-border/60 z-30 transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <ScrollArea className="h-full">
          {/* Profile Card */}
          <div className="p-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/8 to-primary/3 border border-primary/10">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{userTypeLabel(profile?.user_type)}</p>
                </div>
              </div>

              {/* Wallet in sidebar for mobile */}
              <div className="mt-3 flex items-center justify-between sm:hidden">
                <Link
                  to="/wallet"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  <Wallet className="h-4 w-4" />
                  ₦{(profile?.wallet_balance || 0).toLocaleString()}
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-3 pb-2">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Menu</p>
            <div className="space-y-0.5">
              {sidebarNav.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn(
                      'h-[18px] w-[18px] shrink-0 transition-transform duration-200',
                      !isActive && 'group-hover:scale-110'
                    )} />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/60" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Admin Section */}
          {hasAnyAdminRole && (
            <div className="px-3 pt-2 pb-2">
              <div className="h-px bg-border/60 mb-3" />
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Admin</p>
              <Link
                to="/command"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  location.pathname.startsWith('/command')
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Shield className="h-[18px] w-[18px] shrink-0" />
                <span>Command Center</span>
              </Link>
            </div>
          )}

          {/* Sign Out */}
          <div className="px-3 pb-6 pt-2">
            <div className="h-px bg-border/60 mb-3" />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors duration-200"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </ScrollArea>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:pl-64 pt-0 min-h-[calc(100vh-3.5rem)]">
        <div className="container mx-auto px-4 py-6 pb-20 lg:pb-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <MobileNavigation />
      </div>
    </div>
  );
}
