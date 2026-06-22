import { PageHeader } from '@/components/PageHeader';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="KPI cards and compliance summary will appear here."
      />
      <PlaceholderPanel
        title="Coming in FE-10"
        description="Dashboard metrics and compliance reporting will be built after core modules are in place."
      />
    </div>
  );
}
