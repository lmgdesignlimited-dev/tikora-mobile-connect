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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                "min-h-[48px] min-w-[48px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )
            }
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}