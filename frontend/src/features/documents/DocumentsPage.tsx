import { PageHeader } from '@/components/PageHeader';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';

export function DocumentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Review pending uploads and verify student documents."
      />
      <PlaceholderPanel
        title="Coming in FE-6"
        description="Document queue and verification workflow will be added in the documents module."
      />
    </div>
  );
}
