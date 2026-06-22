import { PageHeader } from '@/components/PageHeader';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';

export function StudentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Search, filter, and manage student records."
      />
      <PlaceholderPanel
        title="Coming in FE-4"
        description="Student list, detail, and form screens will be implemented in the students module."
      />
    </div>
  );
}
