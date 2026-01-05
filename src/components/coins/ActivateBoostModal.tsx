import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  Check, 
  Coins,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface BoostPackage {
  id: string;
  name: string;
  description: string;
  boost_type: string;
  coin_cost: number;
  duration_hours: number;
  boost_multiplier: number;
}

interface ActivateBoostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coinBalance: number;
  onSuccess: () => void;
  campaignId?: string;
}

export function ActivateBoostModal({ 
  open, 
  onOpenChange, 
  coinBalance, 
  onSuccess,
  campaignId 
}: ActivateBoostModalProps) {
  const { user } = useAuth();
  const [packages, setPackages] = useState<BoostPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPackages();
    }
  }, [open]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('boost_packages')
        .select('*')
        .eq('is_active', true)
        .order('coin_cost', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching boost packages:', error);
      toast.error('Failed to load boost packages');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedPackage || !user) return;

    const pkg = packages.find(p => p.id === selectedPackage);
    if (!pkg) return;

    if (coinBalance < pkg.coin_cost) {
      toast.error('Insufficient coin balance');
      return;
    }

    setActivating(true);
    try {
      // Call the activate_boost function
      const { data, error } = await supabase.rpc('activate_boost', {
        p_influencer_id: user.id,
        p_package_id: selectedPackage,
        p_campaign_id: campaignId || null
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; expires_at?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to activate boost');
      }

      toast.success(`${pkg.name} activated! Your visibility is now boosted.`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error activating boost:', error);
      toast.error(error.message || 'Failed to activate boost');
    } finally {
      setActivating(false);
    }
  };

  const getDurationLabel = (hours: number) => {
    if (hours < 24) return `${hours} hours`;
    const days = Math.floor(hours / 24);
    return days === 1 ? '1 day' : `${days} days`;
  };

  const getBoostIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <Zap className="h-5 w-5" />;
      case 'weekly':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Boost Your Visibility
          </DialogTitle>
          <DialogDescription>
            Get priority placement when businesses browse influencers.
          </DialogDescription>
        </DialogHeader>

        {/* Coin Balance */}
        <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium">Your Balance</span>
          </div>
          <span className="text-lg font-bold text-amber-600">
            {coinBalance.toLocaleString()} coins
          </span>
        </div>

        <div className="space-y-3 py-2">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            packages.map((pkg) => {
              const canAfford = coinBalance >= pkg.coin_cost;
              
              return (
                <div
                  key={pkg.id}
                  onClick={() => canAfford && setSelectedPackage(pkg.id)}
                  className={`relative p-4 border-2 rounded-lg transition-all ${
                    !canAfford 
                      ? 'border-border opacity-50 cursor-not-allowed'
                      : selectedPackage === pkg.id
                        ? 'border-primary bg-primary/5 cursor-pointer'
                        : 'border-border hover:border-primary/50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedPackage === pkg.id 
                          ? 'bg-primary text-white' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {selectedPackage === pkg.id ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          getBoostIcon(pkg.boost_type)
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {pkg.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {getDurationLabel(pkg.duration_hours)}
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {pkg.boost_multiplier}x visibility
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold flex items-center gap-1">
                        <Coins className="h-4 w-4 text-amber-500" />
                        {pkg.coin_cost}
                      </p>
                      {!canAfford && (
                        <p className="text-xs text-destructive">
                          Not enough coins
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Boost enhances your visibility but doesn't replace performance. 
            Your rating and completion rate still matter for selection.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleActivate}
            disabled={!selectedPackage || activating || coinBalance < (packages.find(p => p.id === selectedPackage)?.coin_cost || 0)}
            className="flex-1 gap-2"
            variant="gradient"
          >
            <Zap className="h-4 w-4" />
            {activating ? 'Activating...' : 'Activate Boost'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
