import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { NotificationDropdown } from '@/components/notifications';
import tikoraIcon from '@/assets/tikora-icon.png';

interface HeaderProps {
  onMenuToggle?: () => void;
  showSearch?: boolean;
}

export function Header({ onMenuToggle, showSearch = true }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <Link to="/" className="flex items-center gap-2">
            <img src={tikoraIcon} alt="Tikora" className="w-9 h-9 rounded-lg" />
            <span className="font-bold text-xl text-foreground hidden sm:block">
              Tikora
            </span>
          </Link>
        </div>

        {/* Center section - Search */}
        {showSearch && (
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns, artists, influencers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Wallet Button */}
          <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
            <Wallet className="h-4 w-4" />
            <span>₦0.00</span>
          </Button>

          {/* Notifications */}
          <NotificationDropdown />

          {/* Profile Avatar */}
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Mobile search bar */}
      {showSearch && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns, artists, influencers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}
    </header>
  );
}