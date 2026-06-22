import { PageHeader } from '@/components/PageHeader';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';

export function LookupsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Lookups"
        description="Manage admission categories and document types."
      />
      <PlaceholderPanel
        title="Coming in FE-3"
        description="Lookup admin screens and shared select components will be added next."
      />
    </div>
  );
}
