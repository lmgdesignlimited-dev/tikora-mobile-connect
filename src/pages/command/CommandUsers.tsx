import { AdminGuard } from '@/components/layout/AdminGuard';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { UserManagement } from '@/components/admin/UserManagement';

export default function CommandUsers() {
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage users, view profiles, and handle suspensions</p>
          </div>
          <UserManagement />
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
