import { Home, Search, Plus, Heart, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', to: '/dashboard' },
  { icon: Search, label: 'Explore', to: '/explore' },
  { icon: Plus, label: 'Create', to: '/create' },
  { icon: Heart, label: 'Activity', to: '/activity' },
  { icon: User, label: 'Profile', to: '/profile' },
];

export function MobileNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around px-1 py-1.5 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors",
                "min-h-[44px] min-w-[44px] flex-1 max-w-[72px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}