import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { ModerationQueue } from '@/components/admin/ModerationQueue';

export default function CommandModeration() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Content Moderation</h1>
          <p className="text-muted-foreground">Review and moderate video submissions</p>
        </div>
        <ModerationQueue />
      </div>
    </AdminLayout>
  );
}
