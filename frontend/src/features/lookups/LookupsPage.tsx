import { List } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MODULE_GRADIENTS } from '@/components/module-ui/moduleGradients';
import { ModuleHeroBanner } from '@/components/module-ui/ModuleHeroBanner';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';
import { LookupAdminPanel } from '@/features/lookups/components/LookupAdminPanel';
import { useLookupAdminLists } from '@/hooks/useLookupAdminLists';
import { cn } from '@/lib/utils';

type TabKey =
  | 'categories'
  | 'document-types'
  | 'standards'
  | 'sections'
  | 'languages';

export function LookupsPage() {
  const { t } = useTranslation('lookups');
  const {
    admissionCategories,
    documentTypes,
    academicStandards,
    sections,
    languages,
    isLoading,
    isError,
  } = useLookupAdminLists();
  const [tab, setTab] = useState<TabKey>('standards');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'standards', label: t('tabs.standards') },
    { key: 'sections', label: t('tabs.sections') },
    { key: 'languages', label: t('tabs.languages') },
    { key: 'categories', label: t('tabs.categories') },
    { key: 'document-types', label: t('tabs.documentTypes') },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeroBanner
        title={t('hero.title')}
        description={t('hero.description')}
        tagline={t('hero.tagline')}
        icon={List}
        gradientClassName={MODULE_GRADIENTS.lookups}
      />

      {isError && (
        <PlaceholderPanel title={t('page.errorTitle')} description={t('page.errorDescription')} />
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
              title={t('panels.standards.title')}
              singularLabel={t('panels.standards.singular')}
              description={t('panels.standards.description')}
              items={academicStandards}
              isLoading={isLoading}
              supportsKannadaLabel
            />
          )}

          {tab === 'sections' && (
            <LookupAdminPanel
              resource="sections"
              title={t('panels.sections.title')}
              singularLabel={t('panels.sections.singular')}
              description={t('panels.sections.description')}
              items={sections}
              isLoading={isLoading}
              supportsKannadaLabel
            />
          )}

          {tab === 'languages' && (
            <LookupAdminPanel
              resource="languages"
              title={t('panels.languages.title')}
              singularLabel={t('panels.languages.singular')}
              description={t('panels.languages.description')}
              items={languages}
              isLoading={isLoading}
              supportsKannadaLabel
            />
          )}

          {tab === 'categories' && (
            <LookupAdminPanel
              resource="admission-categories"
              title={t('panels.categories.title')}
              singularLabel={t('panels.categories.singular')}
              description={t('panels.categories.description')}
              items={admissionCategories}
              isLoading={isLoading}
              supportsKannadaLabel
            />
          )}

          {tab === 'document-types' && (
            <LookupAdminPanel
              resource="document-types"
              title={t('panels.documentTypes.title')}
              singularLabel={t('panels.documentTypes.singular')}
              description={t('panels.documentTypes.description')}
              items={documentTypes}
              isLoading={isLoading}
              supportsKannadaLabel
            />
          )}
        </>
      )}
    </div>
  );
}
