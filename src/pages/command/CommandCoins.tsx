import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { AdminCoinPanel } from '@/components/admin/AdminCoinPanel';

export default function CommandCoins() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Coins & Boosts</h1>
          <p className="text-muted-foreground">Manage coin packages and boost settings</p>
        </div>
        <AdminCoinPanel />
      </div>
    </AdminLayout>
  );
}
