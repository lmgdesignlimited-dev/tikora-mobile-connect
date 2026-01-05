import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Settings, 
  Coins, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  DollarSign,
  Zap,
  Search,
  Ban,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface BoostActivity {
  id: string;
  influencer_id: string;
  boost_type: string;
  coins_spent: number;
  boost_multiplier: number;
  started_at: string;
  expires_at: string;
  is_active: boolean;
  profiles?: {
    full_name: string;
    username: string;
    rating: number;
    completion_rate: number;
  };
}

interface CoinPackage {
  id: string;
  name: string;
  coin_amount: number;
  price_naira: number;
  bonus_coins: number;
  is_popular: boolean;
  is_active: boolean;
}

interface BoostPackage {
  id: string;
  name: string;
  description: string;
  boost_type: string;
  coin_cost: number;
  duration_hours: number;
  boost_multiplier: number;
  is_active: boolean;
}

interface BoostSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
}

export function AdminCoinPanel() {
  const { user } = useAuth();
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [boostPackages, setBoostPackages] = useState<BoostPackage[]>([]);
  const [boostActivities, setBoostActivities] = useState<BoostActivity[]>([]);
  const [settings, setSettings] = useState<BoostSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [coinRes, boostPkgRes, settingsRes] = await Promise.all([
        supabase.from('coin_packages').select('*').order('price_naira'),
        supabase.from('boost_packages').select('*').order('coin_cost'),
        supabase.from('boost_settings').select('*')
      ]);

      if (coinRes.data) setCoinPackages(coinRes.data);
      if (boostPkgRes.data) setBoostPackages(boostPkgRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);

      // Fetch recent boost activities - this requires admin RLS or service role
      // For now, we'll show what the user can see
      const { data: activities } = await supabase
        .from('influencer_boosts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (activities) setBoostActivities(activities);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBoostSystem = async () => {
    const currentSetting = settings.find(s => s.setting_key === 'boost_enabled');
    const currentValue = currentSetting?.setting_value?.enabled ?? true;
    
    try {
      const { error } = await supabase
        .from('boost_settings')
        .update({ 
          setting_value: { enabled: !currentValue },
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'boost_enabled');

      if (error) throw error;
      
      toast.success(`Boost system ${!currentValue ? 'enabled' : 'disabled'}`);
      loadAdminData();
    } catch (error) {
      console.error('Error toggling boost system:', error);
      toast.error('Failed to update setting');
    }
  };

  const togglePackageActive = async (packageId: string, type: 'coin' | 'boost', currentActive: boolean) => {
    try {
      const table = type === 'coin' ? 'coin_packages' : 'boost_packages';
      const { error } = await supabase
        .from(table)
        .update({ is_active: !currentActive })
        .eq('id', packageId);

      if (error) throw error;
      
      toast.success(`Package ${!currentActive ? 'activated' : 'deactivated'}`);
      loadAdminData();
    } catch (error) {
      console.error('Error toggling package:', error);
      toast.error('Failed to update package');
    }
  };

  const isBoostEnabled = settings.find(s => s.setting_key === 'boost_enabled')?.setting_value?.enabled ?? true;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6 text-amber-500" />
            Coin & Boost Management
          </h1>
          <p className="text-muted-foreground">
            Manage pricing, boost parameters, and monitor activities
          </p>
        </div>
        <Button
          onClick={toggleBoostSystem}
          variant={isBoostEnabled ? 'destructive' : 'default'}
          className="gap-2"
        >
          {isBoostEnabled ? (
            <>
              <Ban className="h-4 w-4" />
              Disable Boost System
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Enable Boost System
            </>
          )}
        </Button>
      </div>

      {/* Status Banner */}
      <Card className={isBoostEnabled ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}>
        <CardContent className="py-3 flex items-center gap-2">
          {isBoostEnabled ? (
            <>
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="font-medium">Boost System Active</span>
              <span className="text-muted-foreground">- Influencers can purchase and activate boosts</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="font-medium">Boost System Disabled</span>
              <span className="text-muted-foreground">- No new boosts can be activated</span>
            </>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="pricing">
        <TabsList>
          <TabsTrigger value="pricing" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Coin Pricing
          </TabsTrigger>
          <TabsTrigger value="boosts" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Boost Packages
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Users className="h-4 w-4" />
            Activity Logs
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Coin Pricing Tab */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coin Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {coinPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      !pkg.is_active ? 'opacity-50 bg-muted/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Coins className="h-6 w-6 text-amber-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{pkg.name}</p>
                          {pkg.is_popular && (
                            <Badge className="bg-amber-500">Popular</Badge>
                          )}
                          {!pkg.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pkg.coin_amount} coins
                          {pkg.bonus_coins > 0 && ` + ${pkg.bonus_coins} bonus`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold">₦{pkg.price_naira.toLocaleString()}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePackageActive(pkg.id, 'coin', pkg.is_active)}
                      >
                        {pkg.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Boost Packages Tab */}
        <TabsContent value="boosts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Boost Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {boostPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      !pkg.is_active ? 'opacity-50 bg-muted/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Zap className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{pkg.name}</p>
                          {!pkg.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pkg.description}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{pkg.duration_hours}h duration</Badge>
                          <Badge variant="outline">{pkg.boost_multiplier}x boost</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold flex items-center gap-1">
                          <Coins className="h-4 w-4 text-amber-500" />
                          {pkg.coin_cost}
                        </p>
                        <p className="text-xs text-muted-foreground">coins</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePackageActive(pkg.id, 'boost', pkg.is_active)}
                      >
                        {pkg.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Boost Activity Logs</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by influencer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {boostActivities.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No boost activities yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {boostActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.is_active ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          <Zap className={`h-4 w-4 ${activity.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm capitalize">
                            {activity.boost_type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {activity.influencer_id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="flex items-center gap-1">
                            <Coins className="h-3 w-3 text-amber-500" />
                            {activity.coins_spent} spent
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(activity.started_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={activity.is_active ? 'default' : 'secondary'}>
                          {activity.is_active ? 'Active' : 'Expired'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Boost Algorithm Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium capitalize">
                        {setting.setting_key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {JSON.stringify(setting.setting_value)}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Contact support to modify algorithm parameters.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
