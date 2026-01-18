import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DollarSign,
  Package,
  Music,
  Building,
  Save,
  RefreshCw,
  Percent,
  Coins,
  Edit,
  Check,
  X,
} from 'lucide-react';

interface ServicePackage {
  id: string;
  service_type: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  features: string[] | null;
  category: string;
  delivery_days: number | null;
  is_active: boolean;
}

interface CoinPackage {
  id: string;
  name: string;
  coin_amount: number;
  price_naira: number;
  bonus_coins: number | null;
  is_active: boolean;
  is_popular: boolean;
}

interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  category: string;
  description: string | null;
}

export default function CommandPricing() {
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [servicesRes, coinsRes, settingsRes] = await Promise.all([
        supabase.from('service_packages').select('*').order('category', { ascending: true }),
        supabase.from('coin_packages').select('*').order('coin_amount', { ascending: true }),
        supabase.from('platform_settings').select('*').eq('category', 'pricing'),
      ]);

      if (servicesRes.data) setServicePackages(servicesRes.data);
      if (coinsRes.data) setCoinPackages(coinsRes.data);
      if (settingsRes.data) setPlatformSettings(settingsRes.data);
    } catch (error) {
      console.error('Error loading pricing data:', error);
      toast.error('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  const updateServicePrice = async (id: string, newPrice: number) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from('service_packages')
        .update({ price: newPrice })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Price updated successfully');
      setEditingId(null);
      loadData();
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Failed to update price');
    } finally {
      setSaving(null);
    }
  };

  const toggleServiceActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('service_packages')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Service ${!isActive ? 'enabled' : 'disabled'}`);
      loadData();
    } catch (error) {
      console.error('Error toggling service:', error);
      toast.error('Failed to update service');
    }
  };

  const updateCoinPackage = async (id: string, field: string, value: any) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from('coin_packages')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;
      toast.success('Coin package updated');
      setEditingId(null);
      loadData();
    } catch (error) {
      console.error('Error updating coin package:', error);
      toast.error('Failed to update');
    } finally {
      setSaving(null);
    }
  };

  const updatePlatformSetting = async (key: string, value: any) => {
    setSaving(key);
    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          category: 'pricing',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_key' });

      if (error) throw error;
      toast.success('Setting updated');
      loadData();
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    } finally {
      setSaving(null);
    }
  };

  const getServiceIcon = (category: string) => {
    return category === 'artist' ? (
      <Music className="h-4 w-4 text-purple-500" />
    ) : (
      <Building className="h-4 w-4 text-blue-500" />
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              Pricing Management
            </h1>
            <p className="text-muted-foreground">
              Manage all service prices, coin packages, and platform fees
            </p>
          </div>
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="services">
          <TabsList>
            <TabsTrigger value="services" className="gap-2">
              <Package className="h-4 w-4" />
              Service Prices
            </TabsTrigger>
            <TabsTrigger value="coins" className="gap-2">
              <Coins className="h-4 w-4" />
              Coin Packages
            </TabsTrigger>
            <TabsTrigger value="fees" className="gap-2">
              <Percent className="h-4 w-4" />
              Platform Fees
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Packages</CardTitle>
                <CardDescription>
                  Update prices for all services. Changes apply immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price (₦)</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servicePackages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getServiceIcon(pkg.category)}
                            <span className="font-medium">{pkg.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {pkg.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {editingId === pkg.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(Number(e.target.value))}
                                className="w-24 h-8"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => updateServicePrice(pkg.id, editValue)}
                                disabled={saving === pkg.id}
                              >
                                <Check className="h-4 w-4 text-success" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setEditingId(null)}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ) : (
                            <span className="font-medium">₦{pkg.price.toLocaleString()}</span>
                          )}
                        </TableCell>
                        <TableCell>{pkg.delivery_days ? `${pkg.delivery_days} days` : '-'}</TableCell>
                        <TableCell>
                          <Switch
                            checked={pkg.is_active}
                            onCheckedChange={() => toggleServiceActive(pkg.id, pkg.is_active)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(pkg.id);
                              setEditValue(pkg.price);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coins" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Coin Packages</CardTitle>
                <CardDescription>
                  Configure coin purchase options for users
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package</TableHead>
                      <TableHead>Coins</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Price (₦)</TableHead>
                      <TableHead>Popular</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coinPackages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">{pkg.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Coins className="h-4 w-4 text-warning" />
                            {pkg.coin_amount}
                          </div>
                        </TableCell>
                        <TableCell>
                          {pkg.bonus_coins ? (
                            <Badge className="bg-success/10 text-success border-success/20">
                              +{pkg.bonus_coins}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {editingId === `coin-${pkg.id}` ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(Number(e.target.value))}
                                className="w-24 h-8"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => updateCoinPackage(pkg.id, 'price_naira', editValue)}
                                disabled={saving === pkg.id}
                              >
                                <Check className="h-4 w-4 text-success" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setEditingId(null)}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>₦{pkg.price_naira.toLocaleString()}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => {
                                  setEditingId(`coin-${pkg.id}`);
                                  setEditValue(pkg.price_naira);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={pkg.is_popular || false}
                            onCheckedChange={(checked) => updateCoinPackage(pkg.id, 'is_popular', checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={pkg.is_active || false}
                            onCheckedChange={(checked) => updateCoinPackage(pkg.id, 'is_active', checked)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fees" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5 text-primary" />
                    Platform Fees
                  </CardTitle>
                  <CardDescription>
                    Configure commission and withdrawal fees
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Platform Commission (%)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="20"
                        defaultValue={platformSettings.find(s => s.setting_key === 'platform_commission')?.setting_value || 20}
                        className="w-24"
                        id="platform_commission"
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById('platform_commission') as HTMLInputElement;
                          updatePlatformSetting('platform_commission', Number(input.value));
                        }}
                        disabled={saving === 'platform_commission'}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Commission taken from each campaign payment
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Withdrawal Fee (%)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="3.5"
                        step="0.1"
                        defaultValue={platformSettings.find(s => s.setting_key === 'withdrawal_fee')?.setting_value || 3.5}
                        className="w-24"
                        id="withdrawal_fee"
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById('withdrawal_fee') as HTMLInputElement;
                          updatePlatformSetting('withdrawal_fee', Number(input.value));
                        }}
                        disabled={saving === 'withdrawal_fee'}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Fee deducted when influencers withdraw earnings
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum Withdrawal (₦)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="1000"
                        defaultValue={platformSettings.find(s => s.setting_key === 'min_withdrawal')?.setting_value || 1000}
                        className="w-24"
                        id="min_withdrawal"
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById('min_withdrawal') as HTMLInputElement;
                          updatePlatformSetting('min_withdrawal', Number(input.value));
                        }}
                        disabled={saving === 'min_withdrawal'}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-success" />
                    Campaign Pricing
                  </CardTitle>
                  <CardDescription>
                    Default pricing for campaign types
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Base Video Price (₦)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="5000"
                        defaultValue={platformSettings.find(s => s.setting_key === 'base_video_price')?.setting_value || 5000}
                        className="w-32"
                        id="base_video_price"
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById('base_video_price') as HTMLInputElement;
                          updatePlatformSetting('base_video_price', Number(input.value));
                        }}
                        disabled={saving === 'base_video_price'}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Default price per video for campaigns
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Top Tier Multiplier</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="2.5"
                        step="0.1"
                        defaultValue={platformSettings.find(s => s.setting_key === 'top_tier_multiplier')?.setting_value || 2.5}
                        className="w-24"
                        id="top_tier_multiplier"
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById('top_tier_multiplier') as HTMLInputElement;
                          updatePlatformSetting('top_tier_multiplier', Number(input.value));
                        }}
                        disabled={saving === 'top_tier_multiplier'}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Price multiplier for top-tier influencers
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
