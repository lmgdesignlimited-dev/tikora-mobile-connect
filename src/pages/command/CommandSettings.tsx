import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Settings,
  Save,
  RefreshCw,
  DollarSign,
  Percent,
  Shield,
  Bell,
  Palette,
  Globe,
} from 'lucide-react';

interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
  category: string;
}

export default function CommandSettings() {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .order('category');

      if (error) throw error;
      setSettings(data || []);
      
      // Initialize local state
      const settingsMap: Record<string, any> = {};
      (data || []).forEach((s) => {
        settingsMap[s.setting_key] = s.setting_value;
      });
      setLocalSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSetting = async (key: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('platform_settings')
        .update({ 
          setting_value: localSettings[key],
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', key);

      if (error) throw error;
      toast.success('Setting saved successfully');
    } catch (error) {
      console.error('Error saving setting:', error);
      toast.error('Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payments':
        return <DollarSign className="h-5 w-5" />;
      case 'promotions':
        return <Percent className="h-5 w-5" />;
      case 'automation':
        return <Settings className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              Platform Settings
            </h1>
            <p className="text-muted-foreground">Configure platform behavior, fees, and automation rules</p>
          </div>
          <Button onClick={fetchSettings} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="payments" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="promotions" className="gap-2">
              <Percent className="h-4 w-4" />
              Promotions
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2">
              <Settings className="h-4 w-4" />
              Automation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>Configure escrow, fees, and withdrawal limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Escrow Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Enable Escrow</Label>
                    <p className="text-sm text-muted-foreground">
                      Hold campaign budgets in escrow until work is completed
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.escrow_enabled?.enabled ?? true}
                    onCheckedChange={(checked) => 
                      updateSetting('escrow_enabled', { enabled: checked })
                    }
                  />
                </div>

                {/* Platform Fee Percentages */}
                <div className="space-y-4">
                  <Label className="text-base">Platform Fee Percentages</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Artists</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={localSettings.platform_fee_percentage?.artist ?? 20}
                          onChange={(e) => updateSetting('platform_fee_percentage', {
                            ...localSettings.platform_fee_percentage,
                            artist: parseInt(e.target.value)
                          })}
                          min={0}
                          max={100}
                        />
                        <span className="flex items-center text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Businesses</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={localSettings.platform_fee_percentage?.business ?? 25}
                          onChange={(e) => updateSetting('platform_fee_percentage', {
                            ...localSettings.platform_fee_percentage,
                            business: parseInt(e.target.value)
                          })}
                          min={0}
                          max={100}
                        />
                        <span className="flex items-center text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Influencers</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={localSettings.platform_fee_percentage?.influencer ?? 30}
                          onChange={(e) => updateSetting('platform_fee_percentage', {
                            ...localSettings.platform_fee_percentage,
                            influencer: parseInt(e.target.value)
                          })}
                          min={0}
                          max={100}
                        />
                        <span className="flex items-center text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => saveSetting('platform_fee_percentage')}
                    disabled={saving}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Fees
                  </Button>
                </div>

                {/* Minimum Withdrawal */}
                <div className="space-y-4">
                  <Label className="text-base">Minimum Withdrawal Amount</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>NGN (Naira)</Label>
                      <Input
                        type="number"
                        value={localSettings.min_withdrawal_amount?.NGN ?? 5000}
                        onChange={(e) => updateSetting('min_withdrawal_amount', {
                          ...localSettings.min_withdrawal_amount,
                          NGN: parseInt(e.target.value)
                        })}
                        min={0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>USD</Label>
                      <Input
                        type="number"
                        value={localSettings.min_withdrawal_amount?.USD ?? 10}
                        onChange={(e) => updateSetting('min_withdrawal_amount', {
                          ...localSettings.min_withdrawal_amount,
                          USD: parseInt(e.target.value)
                        })}
                        min={0}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => saveSetting('min_withdrawal_amount')}
                    disabled={saving}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Limits
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promotions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Promotion Pricing</CardTitle>
                <CardDescription>Set cost per goal unit for video promotions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Cost per View (NGN)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={localSettings.promotion_pricing?.views ?? 0.5}
                      onChange={(e) => updateSetting('promotion_pricing', {
                        ...localSettings.promotion_pricing,
                        views: parseFloat(e.target.value)
                      })}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost per Click (NGN)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={localSettings.promotion_pricing?.clicks ?? 2}
                      onChange={(e) => updateSetting('promotion_pricing', {
                        ...localSettings.promotion_pricing,
                        clicks: parseFloat(e.target.value)
                      })}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost per Engagement (NGN)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={localSettings.promotion_pricing?.engagement ?? 1}
                      onChange={(e) => updateSetting('promotion_pricing', {
                        ...localSettings.promotion_pricing,
                        engagement: parseFloat(e.target.value)
                      })}
                      min={0}
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => saveSetting('promotion_pricing')}
                  disabled={saving}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Pricing
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Auto-Approval Rules</CardTitle>
                <CardDescription>Configure automatic approval thresholds</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Auto-approve transactions up to (NGN)</Label>
                    <Input
                      type="number"
                      value={localSettings.auto_approve_threshold?.amount ?? 10000}
                      onChange={(e) => updateSetting('auto_approve_threshold', {
                        ...localSettings.auto_approve_threshold,
                        amount: parseInt(e.target.value)
                      })}
                      min={0}
                    />
                    <p className="text-xs text-muted-foreground">
                      Transactions below this amount will be auto-approved
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum user rating for auto-approval</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={localSettings.auto_approve_threshold?.user_rating ?? 4.5}
                      onChange={(e) => updateSetting('auto_approve_threshold', {
                        ...localSettings.auto_approve_threshold,
                        user_rating: parseFloat(e.target.value)
                      })}
                      min={0}
                      max={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Users with this rating or higher get auto-approved
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => saveSetting('auto_approve_threshold')}
                  disabled={saving}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Rules
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
