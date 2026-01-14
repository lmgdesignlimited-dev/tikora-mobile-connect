import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Settings, 
  Key, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';

interface GatewayConfig {
  id: string;
  gateway_name: string;
  is_active: boolean;
  is_configured: boolean;
  test_mode: boolean;
  settings: any;
  last_verified_at: string | null;
}

interface PaymentLog {
  id: string;
  gateway_name: string;
  event_type: string;
  reference_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export function PaymentGatewayPanel() {
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [secretInputs, setSecretInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gatewayRes, logsRes] = await Promise.all([
        supabase.from('payment_gateway_config').select('*'),
        supabase.from('payment_gateway_logs').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      if (gatewayRes.data) setGateways(gatewayRes.data);
      if (logsRes.data) setLogs(logsRes.data);
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast.error('Failed to load payment gateway data');
    } finally {
      setLoading(false);
    }
  };

  const toggleGateway = async (gatewayName: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_gateway_config')
        .update({ is_active: !isActive })
        .eq('gateway_name', gatewayName);

      if (error) throw error;
      toast.success(`${gatewayName} ${!isActive ? 'enabled' : 'disabled'}`);
      loadData();
    } catch (error) {
      console.error('Error toggling gateway:', error);
      toast.error('Failed to update gateway status');
    }
  };

  const toggleTestMode = async (gatewayName: string, testMode: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_gateway_config')
        .update({ test_mode: !testMode })
        .eq('gateway_name', gatewayName);

      if (error) throw error;
      toast.success(`${gatewayName} now in ${!testMode ? 'test' : 'live'} mode`);
      loadData();
    } catch (error) {
      console.error('Error toggling test mode:', error);
      toast.error('Failed to update gateway mode');
    }
  };

  const saveSecretKey = async (gatewayName: string) => {
    const secretKey = secretInputs[gatewayName];
    if (!secretKey) {
      toast.error('Please enter a secret key');
      return;
    }

    setSaving(gatewayName);
    try {
      // Note: In production, you'd save secrets via edge functions or vault
      // For now, we'll mark the gateway as configured
      const { error } = await supabase
        .from('payment_gateway_config')
        .update({ 
          is_configured: true,
          last_verified_at: new Date().toISOString(),
        })
        .eq('gateway_name', gatewayName);

      if (error) throw error;

      // The actual secret should be added via Lovable's secrets management
      toast.success(`${gatewayName} configured! Please add ${gatewayName.toUpperCase()}_SECRET_KEY to your backend secrets.`);
      toast.info(`Secret key: ${secretKey.slice(0, 10)}...${secretKey.slice(-4)}`, { duration: 10000 });
      
      setSecretInputs(prev => ({ ...prev, [gatewayName]: '' }));
      loadData();
    } catch (error) {
      console.error('Error saving secret:', error);
      toast.error('Failed to configure gateway');
    } finally {
      setSaving(null);
    }
  };

  const getStatusBadge = (gateway: GatewayConfig) => {
    if (!gateway.is_configured) {
      return <Badge variant="outline" className="text-muted-foreground">Not Configured</Badge>;
    }
    if (!gateway.is_active) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    if (gateway.test_mode) {
      return <Badge className="bg-warning/10 text-warning border-warning/20">Test Mode</Badge>;
    }
    return <Badge className="bg-success/10 text-success border-success/20">Live</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Gateways
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure KoraPay and Flutterwave for wallet funding
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="configuration">
        <TabsList>
          <TabsTrigger value="configuration" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Wallet className="h-4 w-4" />
            Transaction Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          {gateways.map((gateway) => (
            <Card key={gateway.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      gateway.gateway_name === 'korapay' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-orange-100 dark:bg-orange-900/30'
                    }`}>
                      <CreditCard className={`h-5 w-5 ${
                        gateway.gateway_name === 'korapay' ? 'text-purple-600' : 'text-orange-600'
                      }`} />
                    </div>
                    <div>
                      <span className="capitalize">{gateway.gateway_name}</span>
                      <p className="text-sm font-normal text-muted-foreground">
                        {gateway.settings?.display_name || gateway.gateway_name}
                      </p>
                    </div>
                  </CardTitle>
                  {getStatusBadge(gateway)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Secret Key Input */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Secret Key
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showSecrets[gateway.gateway_name] ? 'text' : 'password'}
                        placeholder={gateway.is_configured ? '••••••••••••' : 'Enter your secret key'}
                        value={secretInputs[gateway.gateway_name] || ''}
                        onChange={(e) => setSecretInputs(prev => ({ ...prev, [gateway.gateway_name]: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowSecrets(prev => ({ ...prev, [gateway.gateway_name]: !prev[gateway.gateway_name] }))}
                      >
                        {showSecrets[gateway.gateway_name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      onClick={() => saveSecretKey(gateway.gateway_name)}
                      disabled={saving === gateway.gateway_name || !secretInputs[gateway.gateway_name]}
                    >
                      {saving === gateway.gateway_name ? 'Saving...' : 'Save Key'}
                    </Button>
                  </div>
                  {gateway.is_configured && gateway.last_verified_at && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-success" />
                      Last verified: {new Date(gateway.last_verified_at).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Settings */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={gateway.is_active}
                        onCheckedChange={() => toggleGateway(gateway.gateway_name, gateway.is_active)}
                        disabled={!gateway.is_configured}
                      />
                      <Label className="text-sm">Enable Gateway</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={gateway.test_mode}
                        onCheckedChange={() => toggleTestMode(gateway.gateway_name, gateway.test_mode)}
                        disabled={!gateway.is_configured}
                      />
                      <Label className="text-sm">Test Mode</Label>
                    </div>
                  </div>
                  {gateway.test_mode && gateway.is_active && (
                    <Badge variant="outline" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Test transactions only
                    </Badge>
                  )}
                </div>

                {/* Supported Methods */}
                <div className="pt-2">
                  <Label className="text-xs text-muted-foreground">Supported Methods</Label>
                  <div className="flex gap-2 mt-1">
                    {(gateway.settings?.supported_methods || []).map((method: string) => (
                      <Badge key={method} variant="outline" className="capitalize text-xs">
                        {method.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No transaction logs yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          log.status === 'completed' ? 'bg-success/10' : 
                          log.status === 'failed' ? 'bg-destructive/10' : 'bg-muted'
                        }`}>
                          {log.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : log.status === 'failed' ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm capitalize">{log.event_type.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.gateway_name} • {log.reference_id?.slice(0, 12)}...
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          ₦{(log.amount || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
