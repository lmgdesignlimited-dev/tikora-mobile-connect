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
import { Coins, Check, Sparkles, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface CoinPackage {
  id: string;
  name: string;
  coin_amount: number;
  price_naira: number;
  bonus_coins: number;
  is_popular: boolean;
}

interface BuyCoinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BuyCoinModal({ open, onOpenChange, onSuccess }: BuyCoinModalProps) {
  const { user } = useAuth();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPackages();
    }
  }, [open]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coin_packages')
        .select('*')
        .eq('is_active', true)
        .order('price_naira', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
      
      // Auto-select popular package
      const popular = data?.find(p => p.is_popular);
      if (popular) setSelectedPackage(popular.id);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to load coin packages');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !user) return;

    const pkg = packages.find(p => p.id === selectedPackage);
    if (!pkg) return;

    setPurchasing(true);
    try {
      // Create pending transaction
      const { data: transaction, error: txError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'purchase',
          coin_amount: pkg.coin_amount + pkg.bonus_coins,
          naira_amount: pkg.price_naira,
          description: `Purchase: ${pkg.name} (${pkg.coin_amount} + ${pkg.bonus_coins} bonus coins)`,
          reference_id: `COIN${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
          payment_status: 'pending'
        })
        .select()
        .single();

      if (txError) throw txError;

      // For demo: Simulate successful payment
      // In production, integrate with KoraPay/Flutterwave here
      
      // Complete the transaction
      const { error: completeError } = await supabase
        .from('coin_transactions')
        .update({ payment_status: 'completed' })
        .eq('id', transaction.id);

      if (completeError) throw completeError;

      // Get current wallet balance and update
      const { data: wallet } = await supabase
        .from('coin_wallets')
        .select('coin_balance, total_coins_purchased')
        .eq('user_id', user.id)
        .single();

      if (wallet) {
        const { error: walletError } = await supabase
          .from('coin_wallets')
          .update({
            coin_balance: wallet.coin_balance + pkg.coin_amount + pkg.bonus_coins,
            total_coins_purchased: wallet.total_coins_purchased + pkg.coin_amount + pkg.bonus_coins
          })
          .eq('user_id', user.id);

        if (walletError) throw walletError;
      }

      toast.success(`Successfully purchased ${pkg.coin_amount + pkg.bonus_coins} Tikora Coins!`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error purchasing coins:', error);
      toast.error('Failed to process purchase');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            Buy Tikora Coins
          </DialogTitle>
          <DialogDescription>
            Purchase coins to boost your visibility and get selected for more campaigns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPackage === pkg.id
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
                    : 'border-border hover:border-amber-300'
                }`}
              >
                {pkg.is_popular && (
                  <Badge className="absolute -top-2 right-2 bg-amber-500">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedPackage === pkg.id ? 'bg-amber-500' : 'bg-muted'
                    }`}>
                      {selectedPackage === pkg.id ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : (
                        <Coins className={`h-5 w-5 ${pkg.is_popular ? 'text-amber-500' : 'text-muted-foreground'}`} />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{pkg.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.coin_amount.toLocaleString()} coins
                        {pkg.bonus_coins > 0 && (
                          <span className="text-amber-600 ml-1">
                            +{pkg.bonus_coins} bonus
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold">
                    ₦{pkg.price_naira.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <Button
            onClick={handlePurchase}
            disabled={!selectedPackage || purchasing}
            className="w-full gap-2"
            variant="gradient"
          >
            <CreditCard className="h-4 w-4" />
            {purchasing ? 'Processing...' : 'Purchase Now'}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Tikora Coins are non-refundable and cannot be converted to cash.
            <br />
            Coins are for platform use only.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
