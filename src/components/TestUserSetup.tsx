import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Briefcase, Camera } from 'lucide-react';

const testUsers = [
  {
    email: 'artist@demo.com',
    password: 'demo123!',
    full_name: 'Demo Artist',
    user_type: 'artist',
    icon: User,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    email: 'influencer@demo.com', 
    password: 'demo123!',
    full_name: 'Demo Influencer',
    user_type: 'influencer',
    icon: Camera,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    email: 'business@demo.com',
    password: 'demo123!', 
    full_name: 'Demo Business',
    user_type: 'business',
    icon: Briefcase,
    color: 'bg-green-100 text-green-800 border-green-200',
  }
];

export function TestUserSetup() {
  const [isCreating, setIsCreating] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<string[]>([]);

  const createTestUsers = async () => {
    setIsCreating(true);
    const created = [];

    try {
      for (const user of testUsers) {
        try {
          // Try to sign up the user
          const { data, error } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                full_name: user.full_name,
                user_type: user.user_type,
              }
            }
          });

          if (error && !error.message.includes('User already registered')) {
            console.error(`Error creating ${user.email}:`, error);
            toast.error(`Failed to create ${user.email}: ${error.message}`);
          } else {
            created.push(user.email);
            toast.success(`✅ ${user.email} ready to use`);
          }
        } catch (err) {
          console.error(`Error with ${user.email}:`, err);
        }
      }

      setCreatedUsers(created);
      if (created.length > 0) {
        toast.success(`🎉 ${created.length} test users are ready!`);
      }
    } catch (error) {
      console.error('Error creating test users:', error);
      toast.error('Failed to create test users');
    } finally {
      setIsCreating(false);
    }
  };

  const loginAsUser = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(`Login failed: ${error.message}`);
      } else {
        toast.success(`Logged in as ${email}`);
      }
    } catch (error) {
      toast.error('Login failed');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-center">🧪 Test User Setup</CardTitle>
        <p className="text-center text-sm text-muted-foreground">
          Create and login as demo users to test all dashboard types
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={createTestUsers} 
          disabled={isCreating}
          className="w-full"
          variant="outline"
        >
          {isCreating ? 'Creating Test Users...' : '🔧 Setup Test Users'}
        </Button>

        <div className="grid gap-3">
          {testUsers.map((user) => {
            const Icon = user.icon;
            return (
              <div key={user.email} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{user.full_name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="text-xs text-muted-foreground">Password: {user.password}</div>
                  </div>
                  <Badge className={user.color}>
                    {user.user_type}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => loginAsUser(user.email, user.password)}
                >
                  Login
                </Button>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-center text-muted-foreground mt-4">
          ℹ️ Click "Setup Test Users" first, then use "Login" buttons to test each dashboard
        </div>
      </CardContent>
    </Card>
  );
}