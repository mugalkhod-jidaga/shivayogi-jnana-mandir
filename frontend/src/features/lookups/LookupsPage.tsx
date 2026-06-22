import { useState } from 'react';
import { AdmissionCategorySelect } from '@/components/lookups/AdmissionCategorySelect';
import { BloodGroupSelect } from '@/components/lookups/BloodGroupSelect';
import { DocumentTypeSelect } from '@/components/lookups/DocumentTypeSelect';
import { PageHeader } from '@/components/PageHeader';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';
import { Label } from '@/components/ui/label';
import { useLookups } from '@/hooks/useLookups';

export function LookupsPage() {
  const { bloodGroups, admissionCategories, documentTypes, isLoading, isError } = useLookups();
  const [bloodGroupId, setBloodGroupId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [documentTypeId, setDocumentTypeId] = useState('');

  const selectedBloodGroup = bloodGroups.find((item) => String(item.id) === bloodGroupId)?.value;
  const selectedCategory = admissionCategories.find((item) => String(item.id) === categoryId)?.value;
  const selectedDocumentType = documentTypes.find(
    (item) => String(item.id) === documentTypeId,
  )?.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lookups"
        description="Shared reference data for student forms and document workflows."
      />

      {isError && (
        <PlaceholderPanel
          title="Could not load lookups"
          description="Check that the backend is running and you are signed in."
        />
      )}

      {!isError && (
        <div className="grid gap-6 lg:grid-cols-2">
          <PlaceholderPanel
            title="Lookup cache"
            description="All three lookup endpoints are fetched in parallel and cached for 30 minutes via TanStack Query."
          >
            <dl className="mt-4 grid grid-cols-3 gap-3 text-left text-sm">
              <div>
                <dt className="text-muted-foreground">Blood groups</dt>
                <dd className="font-medium">{isLoading ? '…' : bloodGroups.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Categories</dt>
                <dd className="font-medium">{isLoading ? '…' : admissionCategories.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Document types</dt>
                <dd className="font-medium">{isLoading ? '…' : documentTypes.length}</dd>
              </div>
            </dl>
          </PlaceholderPanel>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-medium">Shared select components</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These dropdowns will be reused in student and document forms.
            </p>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="blood-group-preview">Blood group</Label>
                <BloodGroupSelect
                  id="blood-group-preview"
                  value={bloodGroupId}
                  onChange={setBloodGroupId}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-preview">Admission category</Label>
                <AdmissionCategorySelect
                  id="category-preview"
                  value={categoryId}
                  onChange={setCategoryId}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-type-preview">Document type</Label>
                <DocumentTypeSelect
                  id="document-type-preview"
                  value={documentTypeId}
                  onChange={setDocumentTypeId}
                />
              </div>
            </div>

            {(selectedBloodGroup || selectedCategory || selectedDocumentType) && (
              <p className="mt-4 text-sm text-muted-foreground">
                Selected:{' '}
                {[selectedBloodGroup, selectedCategory, selectedDocumentType]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>
        </div>
      )}

      <PlaceholderPanel
        title="Admin CRUD coming later"
        description="Create, edit, and deactivate lookup values will be added when the lookups admin module is built."
      />
    </div>
  );
}
