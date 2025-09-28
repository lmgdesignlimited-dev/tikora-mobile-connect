import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function DebugPanel() {
  const { user, session, loading } = useAuth();
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [profileCount, setProfileCount] = useState<number>(0);

  useEffect(() => {
    checkDbConnection();
  }, []);

  const checkDbConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact' })
        .limit(1);

      if (error) {
        console.error('DB Error:', error);
        setDbStatus('error');
      } else {
        setDbStatus('connected');
        setProfileCount(data?.length || 0);
      }
    } catch (err) {
      console.error('DB Connection Error:', err);
      setDbStatus('error');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle className="text-center">🔍 Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Auth Status:</strong>
            <Badge className={loading ? 'bg-yellow-100 text-yellow-800' : user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {loading ? 'Loading' : user ? 'Authenticated' : 'Not Authenticated'}
            </Badge>
          </div>
          
          <div>
            <strong>Database:</strong>
            <Badge className={dbStatus === 'connected' ? 'bg-green-100 text-green-800' : dbStatus === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
              {dbStatus}
            </Badge>
          </div>

          <div>
            <strong>User Email:</strong>
            <span className="ml-2">{user?.email || 'None'}</span>
          </div>

          <div>
            <strong>Session:</strong>
            <Badge className={session ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {session ? 'Active' : 'None'}
            </Badge>
          </div>

          <div>
            <strong>Profile Count:</strong>
            <span className="ml-2">{profileCount}</span>
          </div>

          <div>
            <strong>Current URL:</strong>
            <span className="ml-2 text-xs">{window.location.pathname}</span>
          </div>
        </div>

        {user && (
          <div className="mt-4 p-2 bg-muted rounded text-xs">
            <strong>User Data:</strong>
            <pre className="whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify({ id: user.id, email: user.email, created_at: user.created_at }, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}