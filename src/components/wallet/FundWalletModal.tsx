import { useState } from 'react';
import { CreditCard, Smartphone, Bitcoin, AlertCircle, Upload, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface FundWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function FundWalletModal({ open, onOpenChange, onSuccess }: FundWalletModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('korapay');
  const [cryptoType, setCryptoType] = useState('USDT');
  const [txHash, setTxHash] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cryptoSubmitted, setCryptoSubmitted] = useState(false);

  const quickAmounts = [1000, 5000, 10000, 25000, 50000, 100000];

  const cryptoWallets = {
    USDT: { 
      address: 'TRX1234567890ABCDEFGHIJKLMNOP',
      network: 'TRC-20'
    },
    BTC: { 
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      network: 'Bitcoin'
    },
    ETH: { 
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595',
      network: 'ERC-20'
    },
  };

  const handleFiatPayment = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) < 100) {
      toast.error('Please enter a valid amount (minimum ₦100)');
      return;
    }

    setIsLoading(true);
    try {
      const referenceId = `TIK${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
      // Create pending transaction
      const { error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user?.id,
          transaction_type: 'deposit',
          amount: Number(amount),
          description: `Wallet funding via ${paymentMethod === 'korapay' ? 'KoraPay' : 'Flutterwave'}`,
          payment_method: paymentMethod,
          status: 'pending',
          reference_id: referenceId,
        });

      if (error) throw error;

      // TODO: Integrate with actual payment gateway
      // For now, show success message
      toast.success('Payment initiated! Redirecting to payment gateway...');
      
      // Simulate redirect to payment gateway
      setTimeout(() => {
        toast.info('This is a demo. In production, you would be redirected to the payment gateway.');
        onSuccess();
        onOpenChange(false);
      }, 2000);

    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('Failed to initiate payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCryptoPayment = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) < 5000) {
      toast.error('Please enter a valid amount (minimum ₦5,000 for crypto)');
      return;
    }

    if (!txHash) {
      toast.error('Please enter your transaction hash');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('crypto_payment_requests')
        .insert({
          user_id: user?.id,
          amount: Number(amount),
          crypto_type: cryptoType,
          wallet_address: cryptoWallets[cryptoType as keyof typeof cryptoWallets].address,
          tx_hash: txHash,
          payment_proof_url: paymentProof || null,
          status: 'pending',
        });

      if (error) throw error;

      setCryptoSubmitted(true);
      toast.success('Crypto payment submitted for review!');

    } catch (error) {
      console.error('Error submitting crypto payment:', error);
      toast.error('Failed to submit payment');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setTxHash('');
    setPaymentProof('');
    setCryptoSubmitted(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fund Your Wallet</DialogTitle>
          <DialogDescription>
            Choose your preferred payment method to add funds
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="fiat" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fiat" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Card/Bank
            </TabsTrigger>
            <TabsTrigger value="crypto" className="gap-2">
              <Bitcoin className="h-4 w-4" />
              Crypto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fiat" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Amount (₦)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="100"
              />
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(amt.toString())}
                    className="text-xs"
                  >
                    ₦{amt.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === 'korapay' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('korapay')}
                  className="h-14 flex-col gap-1"
                >
                  <Smartphone className="h-5 w-5" />
                  <span className="text-xs">KoraPay</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'flutterwave' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('flutterwave')}
                  className="h-14 flex-col gap-1"
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs">Flutterwave</span>
                </Button>
              </div>
            </div>

            <Button
              onClick={handleFiatPayment}
              disabled={isLoading || !amount}
              className="w-full"
              variant="gradient"
            >
              {isLoading ? 'Processing...' : `Pay ₦${Number(amount || 0).toLocaleString()}`}
            </Button>
          </TabsContent>

          <TabsContent value="crypto" className="space-y-4 mt-4">
            {cryptoSubmitted ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle className="h-16 w-16 text-success mx-auto" />
                <div>
                  <h3 className="font-semibold text-lg">Payment Submitted!</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your crypto payment is being reviewed by our admin team. 
                    You'll be notified once it's approved (usually within 1-24 hours).
                  </p>
                </div>
                <Button onClick={() => {
                  resetForm();
                  onOpenChange(false);
                }}>
                  Done
                </Button>
              </div>
            ) : (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Crypto payments require manual verification by our admin team. 
                    Processing may take 1-24 hours.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Amount (₦ equivalent)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount in Naira"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="5000"
                  />
                  <p className="text-xs text-muted-foreground">Minimum: ₦5,000</p>
                </div>

                <div className="space-y-2">
                  <Label>Cryptocurrency</Label>
                  <Select value={cryptoType} onValueChange={setCryptoType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDT">USDT (TRC-20)</SelectItem>
                      <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Send to this address</Label>
                  <div className="p-3 bg-muted rounded-lg break-all">
                    <p className="text-xs font-mono">
                      {cryptoWallets[cryptoType as keyof typeof cryptoWallets].address}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Network: {cryptoWallets[cryptoType as keyof typeof cryptoWallets].network}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Transaction Hash *</Label>
                  <Input
                    placeholder="Enter your transaction hash"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Proof URL (Optional)</Label>
                  <Input
                    placeholder="Link to screenshot or proof"
                    value={paymentProof}
                    onChange={(e) => setPaymentProof(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleCryptoPayment}
                  disabled={isLoading || !amount || !txHash}
                  className="w-full"
                  variant="gradient"
                >
                  {isLoading ? 'Submitting...' : 'Submit for Review'}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
