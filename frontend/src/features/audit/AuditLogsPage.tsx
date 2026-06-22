import { PageHeader } from '@/components/PageHeader';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';

export function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Search and review system activity across the tenant."
      />
      <PlaceholderPanel
        title="Coming in FE-10"
        description="Paginated audit log viewer will be added with the dashboard phase."
      />
    </div>
  );
}
