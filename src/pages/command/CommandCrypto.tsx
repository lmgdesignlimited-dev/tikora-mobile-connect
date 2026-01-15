import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { CryptoPaymentPanel } from '@/components/admin/CryptoPaymentPanel';

export default function CommandCrypto() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Crypto Payments</h1>
          <p className="text-muted-foreground">Review and approve crypto payment requests</p>
        </div>
        <CryptoPaymentPanel />
      </div>
    </AdminLayout>
  );
}
