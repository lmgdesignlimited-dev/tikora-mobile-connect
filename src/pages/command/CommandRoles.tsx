import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { RoleManagement } from '@/components/admin/RoleManagement';

export default function CommandRoles() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">Assign and manage admin roles for team members</p>
        </div>
        <RoleManagement />
      </div>
    </AdminLayout>
  );
}
