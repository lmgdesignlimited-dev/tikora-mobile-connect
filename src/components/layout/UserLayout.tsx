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
import { Separator } from '@/components/ui/separator';
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
  Video,
  Menu,
  X,
  LogOut,
  Shield,
  ChevronLeft,
  Settings,
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

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center h-14 px-4">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mr-4">
            <img src={tikoraIcon} alt="Tikora" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-lg text-foreground hidden sm:block">Tikora</span>
          </Link>

          <div className="flex-1" />

          {/* Wallet */}
          <Button variant="outline" size="sm" className="hidden sm:flex gap-2 mr-2" asChild>
            <Link to="/wallet">
              <Wallet className="h-4 w-4" />
              <span>₦{(profile?.wallet_balance || 0).toLocaleString()}</span>
            </Link>
          </Button>

          {/* Notifications */}
          <NotificationDropdown />

          {/* Profile Avatar */}
          <Link to="/profile" className="ml-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url} alt="Profile" />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed top-14 left-0 bottom-0 w-60 bg-card border-r border-border z-30 transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <ScrollArea className="h-full py-4">
          {/* Profile summary */}
          <div className="px-4 mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile?.user_type || 'member'}</p>
              </div>
            </div>
            {/* Mobile wallet */}
            <div className="mt-3 p-2.5 rounded-lg bg-primary/5 border border-primary/10 sm:hidden">
              <Link to="/wallet" className="flex items-center gap-2 text-sm" onClick={() => setSidebarOpen(false)}>
                <Wallet className="h-4 w-4 text-primary" />
                <span className="font-semibold">₦{(profile?.wallet_balance || 0).toLocaleString()}</span>
              </Link>
            </div>
          </div>

          <Separator className="mb-2" />

          {/* Navigation */}
          <nav className="px-3 space-y-1">
            {sidebarNav.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <Separator className="my-4" />

          {/* Admin Link */}
          {hasAnyAdminRole && (
            <div className="px-3 mb-2">
              <Link
                to="/command"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Shield className="h-5 w-5 shrink-0" />
                <span>Command Center</span>
              </Link>
            </div>
          )}

          {/* Sign Out */}
          <div className="px-3">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full"
            >
              <LogOut className="h-5 w-5 shrink-0" />
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
      <main className="lg:pl-60 pt-0 min-h-[calc(100vh-3.5rem)]">
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
