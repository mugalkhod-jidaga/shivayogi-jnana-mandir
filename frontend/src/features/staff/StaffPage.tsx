import { PageHeader } from '@/components/PageHeader';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';

export function StaffPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Create staff accounts, assign roles, and manage access."
      />
      <PlaceholderPanel
        title="Coming in FE-8"
        description="Staff list and admin actions will be built in the staff module."
      />
    </div>
  );
}
