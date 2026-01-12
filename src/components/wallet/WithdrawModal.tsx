import { useState } from 'react';
import { Building, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  walletBalance: number;
  bankDetails?: {
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
  };
}

const nigerianBanks = [
  'Access Bank',
  'Zenith Bank',
  'GTBank',
  'First Bank',
  'UBA',
  'Union Bank',
  'Fidelity Bank',
  'Sterling Bank',
  'Wema Bank',
  'Stanbic IBTC',
  'Polaris Bank',
  'Keystone Bank',
  'FCMB',
  'Ecobank',
  'Heritage Bank',
  'Providus Bank',
  'Opay',
  'Kuda Bank',
  'Palmpay',
  'Moniepoint',
];

export function WithdrawModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  walletBalance,
  bankDetails 
}: WithdrawModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState(bankDetails?.bank_name || '');
  const [accountNumber, setAccountNumber] = useState(bankDetails?.bank_account_number || '');
  const [accountName, setAccountName] = useState(bankDetails?.bank_account_name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [saveBankDetails, setSaveBankDetails] = useState(false);

  const minWithdrawal = 1000;
  const withdrawalFee = 50;

  const handleWithdraw = async () => {
    const withdrawAmount = Number(amount);
    
    if (!amount || isNaN(withdrawAmount) || withdrawAmount < minWithdrawal) {
      toast.error(`Minimum withdrawal is ₦${minWithdrawal.toLocaleString()}`);
      return;
    }

    if (withdrawAmount + withdrawalFee > walletBalance) {
      toast.error('Insufficient balance (including ₦50 fee)');
      return;
    }

    if (!bankName || !accountNumber || !accountName) {
      toast.error('Please fill in all bank details');
      return;
    }

    if (accountNumber.length !== 10) {
      toast.error('Account number must be 10 digits');
      return;
    }

    setIsLoading(true);
    try {
      const referenceId = `WD${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

      // Create withdrawal transaction
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user?.id,
          transaction_type: 'withdrawal',
          amount: withdrawAmount,
          description: `Withdrawal to ${bankName} - ${accountNumber}`,
          payment_method: 'bank_transfer',
          status: 'pending',
          reference_id: referenceId,
          metadata: {
            bank_name: bankName,
            account_number: accountNumber,
            account_name: accountName,
            fee: withdrawalFee,
          },
        });

      if (txError) throw txError;

      // Deduct from wallet balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          wallet_balance: walletBalance - withdrawAmount - withdrawalFee 
        })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      // Save bank details if checkbox is checked
      if (saveBankDetails) {
        await supabase
          .from('profiles')
          .update({
            bank_name: bankName,
            bank_account_number: accountNumber,
            bank_account_name: accountName,
          })
          .eq('user_id', user?.id);
      }

      toast.success('Withdrawal request submitted! Processing takes 1-3 business days.');
      onSuccess();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.error('Failed to process withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Withdraw to your Nigerian bank account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Withdrawals are processed within 1-3 business days. 
              A ₦{withdrawalFee} fee applies to all withdrawals.
            </AlertDescription>
          </Alert>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-2xl font-bold text-primary">
              ₦{walletBalance.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Amount to Withdraw (₦)</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={minWithdrawal}
              max={walletBalance - withdrawalFee}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Min: ₦{minWithdrawal.toLocaleString()}</span>
              <span>Fee: ₦{withdrawalFee}</span>
            </div>
            {amount && Number(amount) > 0 && (
              <p className="text-sm">
                You'll receive: <span className="font-semibold">₦{(Number(amount)).toLocaleString()}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Bank Name</Label>
            <Select value={bankName} onValueChange={setBankName}>
              <SelectTrigger>
                <SelectValue placeholder="Select your bank" />
              </SelectTrigger>
              <SelectContent>
                {nigerianBanks.map((bank) => (
                  <SelectItem key={bank} value={bank}>
                    {bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Account Number</Label>
            <Input
              type="text"
              placeholder="10-digit account number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label>Account Name</Label>
            <Input
              type="text"
              placeholder="Name on account"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>

          {!bankDetails?.bank_account_number && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={saveBankDetails}
                onChange={(e) => setSaveBankDetails(e.target.checked)}
                className="rounded border-border"
              />
              Save bank details for future withdrawals
            </label>
          )}

          <Button
            onClick={handleWithdraw}
            disabled={isLoading || !amount || Number(amount) < minWithdrawal}
            className="w-full"
            variant="gradient"
          >
            {isLoading ? 'Processing...' : 'Request Withdrawal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
