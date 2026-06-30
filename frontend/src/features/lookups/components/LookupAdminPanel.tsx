import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { AddLookupDialog } from '@/features/lookups/components/AddLookupDialog';
import { DeactivateLookupDialog } from '@/features/lookups/components/DeactivateLookupDialog';
import { EditLookupDialog } from '@/features/lookups/components/EditLookupDialog';
import type { LookupResource } from '@/hooks/useLookupAdmin';
import type { TenantLookupOption } from '@/types/lookup';

type LookupAdminPanelProps = {
  resource: LookupResource;
  title: string;
  singularLabel: string;
  description: string;
  items: TenantLookupOption[];
  isLoading: boolean;
  supportsKannadaLabel?: boolean;
};

export function LookupAdminPanel({
  resource,
  title,
  singularLabel,
  description,
  items,
  isLoading,
  supportsKannadaLabel = false,
}: LookupAdminPanelProps) {
  const { t } = useTranslation('lookups');
  const { t: tc } = useTranslation();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TenantLookupOption | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<TenantLookupOption | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          {t('admin.add')}
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">{tc('loading')}</p>}

      {!isLoading && items.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('admin.noValues')}</p>
      )}

      {!isLoading && items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">{t('admin.columns.name')}</th>
                {supportsKannadaLabel && (
                  <th className="px-4 py-3 font-medium">{t('admin.columns.nameKn')}</th>
                )}
                <th className="px-4 py-3 font-medium">{t('admin.columns.status')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">{item.labels?.en ?? item.value}</td>
                  {supportsKannadaLabel && (
                    <td className="px-4 py-3 text-muted-foreground">{item.labels?.kn ?? '—'}</td>
                  )}
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {t('admin.active')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {supportsKannadaLabel && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditTarget(item)}
                        >
                          {t('admin.edit')}
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setDeactivateTarget(item)}
                      >
                        {t('admin.deactivate')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddLookupDialog
        resource={resource}
        label={singularLabel}
        open={addOpen}
        onOpenChange={setAddOpen}
        supportsKannadaLabel={supportsKannadaLabel}
      />

      {editTarget && (
        <EditLookupDialog
          resource={resource}
          label={singularLabel}
          item={editTarget}
          open
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
        />
      )}

      {deactivateTarget && (
        <DeactivateLookupDialog
          resource={resource}
          label={singularLabel}
          value={deactivateTarget.labels?.en ?? deactivateTarget.value}
          id={deactivateTarget.id}
          open
          onOpenChange={(open) => {
            if (!open) setDeactivateTarget(null);
          }}
        />
      )}
    </div>
  );
}
