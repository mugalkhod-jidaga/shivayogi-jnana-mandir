import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';
import { LookupAdminPanel } from '@/features/lookups/components/LookupAdminPanel';
import { useLookups } from '@/hooks/useLookups';
import { cn } from '@/lib/utils';

type TabKey =
  | 'categories'
  | 'document-types'
  | 'standards'
  | 'sections'
  | 'languages';

export function LookupsPage() {
  const {
    admissionCategories,
    documentTypes,
    academicStandards,
    sections,
    languages,
    isLoading,
    isError,
  } = useLookups();
  const [tab, setTab] = useState<TabKey>('standards');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'standards', label: 'Standards' },
    { key: 'sections', label: 'Sections' },
    { key: 'languages', label: 'Languages' },
    { key: 'categories', label: 'Admission categories' },
    { key: 'document-types', label: 'Document types' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lookups"
        description="Manage tenant-specific dropdown values for student forms and document uploads."
      />

      {isError && (
        <PlaceholderPanel
          title="Could not load lookups"
          description="Check that the backend is running and you are signed in."
        />
      )}

      {!isError && (
        <>
          <div className="flex flex-wrap gap-2 border-b">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                className={cn(
                  'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                  tab === item.key
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'standards' && (
            <LookupAdminPanel
              resource="academic-standards"
              title="Academic standards"
              singularLabel="Standard"
              description="Class levels used for enrollment (e.g. 1–10, LKG, UKG)."
              items={academicStandards}
              isLoading={isLoading}
            />
          )}

          {tab === 'sections' && (
            <LookupAdminPanel
              resource="sections"
              title="Sections"
              singularLabel="Section"
              description="Optional class sections (A, B, …). Activate when the school uses sections."
              items={sections}
              isLoading={isLoading}
            />
          )}

          {tab === 'languages' && (
            <LookupAdminPanel
              resource="languages"
              title="Languages"
              singularLabel="Language"
              description="Mother tongue options on the student form."
              items={languages}
              isLoading={isLoading}
            />
          )}

          {tab === 'categories' && (
            <LookupAdminPanel
              resource="admission-categories"
              title="Admission categories"
              singularLabel="Admission category"
              description="Used on the student form. Blood groups are global and managed separately."
              items={admissionCategories}
              isLoading={isLoading}
            />
          )}

          {tab === 'document-types' && (
            <LookupAdminPanel
              resource="document-types"
              title="Document types"
              singularLabel="Document type"
              description="Used when uploading student verification documents."
              items={documentTypes}
              isLoading={isLoading}
            />
          )}
        </>
      )}
    </div>
  );
}
