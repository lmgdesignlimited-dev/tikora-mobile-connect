import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { AdminActivityLog } from '@/components/admin/AdminActivityLog';

export default function CommandActivity() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground">View all admin actions and system events</p>
        </div>
        <AdminActivityLog />
      </div>
    </AdminLayout>
  );
}
