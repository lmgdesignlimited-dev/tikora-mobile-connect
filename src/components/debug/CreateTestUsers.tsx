import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function CreateTestUsers() {
  const [isCreating, setIsCreating] = useState(false);
  const [results, setResults] = useState<any>(null);

  const createTestUsers = async () => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-test-users', {
        body: {}
      });

      if (error) {
        console.error('Function error:', error);
        toast.error('Failed to create test users');
        return;
      }

      setResults(data);
      toast.success('Test users created successfully!');
    } catch (error) {
      console.error('Error calling function:', error);
      toast.error('Failed to create test users');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Debug: Create Test Users</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={createTestUsers} 
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? 'Creating Test Users...' : 'Create Test Users'}
        </Button>

        {results && (
          <div className="space-y-4">
            <h3 className="font-semibold">Login Credentials:</h3>
            <div className="grid gap-2 text-sm">
              <div className="p-3 bg-muted rounded">
                <strong>Artist Dashboard:</strong><br />
                Email: artist@demo.com<br />
                Password: demo123456
              </div>
              <div className="p-3 bg-muted rounded">
                <strong>Influencer Dashboard:</strong><br />
                Email: influencer@demo.com<br />
                Password: demo123456
              </div>
              <div className="p-3 bg-muted rounded">
                <strong>Business Dashboard:</strong><br />
                Email: business@demo.com<br />
                Password: demo123456
              </div>
            </div>

            {results.results && (
              <div className="space-y-2">
                <h4 className="font-medium">Creation Status:</h4>
                {results.results.map((result: any, index: number) => (
                  <div key={index} className="text-sm p-2 bg-muted rounded">
                    <strong>{result.email}:</strong> {result.status}
                    {result.error && <span className="text-destructive"> - {result.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}