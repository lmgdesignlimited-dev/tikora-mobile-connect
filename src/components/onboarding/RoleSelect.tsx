import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type UserType = 'artist' | 'influencer' | 'business';

export function RoleSelect({
  onSelected,
}: {
  onSelected: (type: UserType) => void;
}) {
  const { user } = useAuth();
  const [userType, setUserType] = useState<UserType | ''>('');
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  const defaultName = useMemo(() => {
    const email = user?.email ?? '';
    return email ? email.split('@')[0] : '';
  }, [user?.email]);

  const handleContinue = async () => {
    if (!user) return;
    if (!userType) {
      toast.error('Please select your account type');
      return;
    }

    const nameToSave = (fullName || defaultName).trim();
    if (!nameToSave) {
      toast.error('Please enter your name');
      return;
    }

    setSaving(true);
    try {
      const { error: profileError } = await supabase.from('profiles').upsert([
        {
          user_id: user.id,
          email: user.email,
          full_name: nameToSave,
          user_type: userType,
        },
      ]);
      if (profileError) throw profileError;

      await supabase.from('onboarding_progress').upsert({
        user_id: user.id,
        user_type: userType,
        current_step: 0,
        total_steps: 4,
        is_completed: false,
        profile_completed: false,
      });

      toast.success('Great — let’s finish your setup.');
      onSelected(userType);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to start onboarding');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Complete your setup</CardTitle>
          <CardDescription>
            Choose your account type so we can personalize your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={fullName}
              placeholder={defaultName ? defaultName : 'Your name'}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Account type</Label>
            <Select value={userType} onValueChange={(v) => setUserType(v as UserType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="artist">Artist / Musician</SelectItem>
                <SelectItem value="influencer">Influencer / Creator</SelectItem>
                <SelectItem value="business">Business / Brand</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="gradient"
            className="w-full"
            disabled={saving}
            onClick={handleContinue}
          >
            {saving ? 'Saving...' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
