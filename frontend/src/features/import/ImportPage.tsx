import { PageHeader } from '@/components/PageHeader';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';

export function ImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Import"
        description="Upload a CSV, preview errors, and commit student records."
      />
      <PlaceholderPanel
        title="Coming in FE-9"
        description="The three-step CSV migration wizard will be implemented in the import module."
      />
    </div>
  );
}
