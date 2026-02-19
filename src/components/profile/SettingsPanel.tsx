import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Loader2,
  CreditCard,
  Globe,
  Bell,
  Shield,
  DollarSign,
  Lock,
} from 'lucide-react';

interface SettingsPanelProps {
  profile: any;
  onProfileUpdated: () => void;
}

export function SettingsPanel({ profile, onProfileUpdated }: SettingsPanelProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Bank details
  const [bankName, setBankName] = useState(profile?.bank_name || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(profile?.bank_account_number || '');
  const [bankAccountName, setBankAccountName] = useState(profile?.bank_account_name || '');
  const [cryptoWalletAddress, setCryptoWalletAddress] = useState(profile?.crypto_wallet_address || '');

  // Preferences
  const [preferredCurrency, setPreferredCurrency] = useState(profile?.preferred_currency || 'NGN');
  const [customPrice, setCustomPrice] = useState(profile?.custom_price?.toString() || '0');

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (profile) {
      setBankName(profile.bank_name || '');
      setBankAccountNumber(profile.bank_account_number || '');
      setBankAccountName(profile.bank_account_name || '');
      setCryptoWalletAddress(profile.crypto_wallet_address || '');
      setPreferredCurrency(profile.preferred_currency || 'NGN');
      setCustomPrice(profile.custom_price?.toString() || '0');
    }
  }, [profile]);

  const handleSaveBankDetails = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bank_name: bankName || null,
          bank_account_number: bankAccountNumber || null,
          bank_account_name: bankAccountName || null,
          crypto_wallet_address: cryptoWalletAddress || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Bank details saved');
      onProfileUpdated();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          preferred_currency: preferredCurrency,
          custom_price: Number(customPrice) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Preferences saved');
      onProfileUpdated();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const isInfluencer = profile?.user_type === 'influencer';

  return (
    <div className="space-y-6">
      {/* Payment / Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bank & Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bank Name</Label>
            <Input placeholder="e.g. GTBank, Access Bank" value={bankName} onChange={e => setBankName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input placeholder="0123456789" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input placeholder="John Doe" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Crypto Wallet Address (USDT)</Label>
            <Input placeholder="TRC20 or BEP20 address" value={cryptoWalletAddress} onChange={e => setCryptoWalletAddress(e.target.value)} />
          </div>
          <Button onClick={handleSaveBankDetails} disabled={saving} className="w-full sm:w-auto">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save Payment Details'}
          </Button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Preferred Currency</Label>
            <Select value={preferredCurrency} onValueChange={setPreferredCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                <SelectItem value="GHS">Ghanaian Cedi (₵)</SelectItem>
                <SelectItem value="USD">US Dollar ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isInfluencer && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Custom Rate (₦)
              </Label>
              <Input
                type="number"
                placeholder="Your default rate per campaign"
                value={customPrice}
                onChange={e => setCustomPrice(e.target.value)}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                This is your default rate shown to brands. You can override it per application. Set to 0 to use platform rates.
              </p>
            </div>
          )}

          <Button onClick={handleSavePreferences} disabled={saving} className="w-full sm:w-auto">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword} variant="outline" className="w-full sm:w-auto">
            {changingPassword ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</> : 'Change Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account Type</span>
            <span className="capitalize">{profile?.user_type || 'User'}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Member Since</span>
            <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Verification</span>
            <span className="capitalize">{profile?.verification_status || 'Pending'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
