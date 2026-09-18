import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AddAcademicYearDialog } from '@/features/lookups/components/AddAcademicYearDialog';
import { EditAcademicYearDialog } from '@/features/lookups/components/EditAcademicYearDialog';
import { useAcademicYearsAdmin, useUpdateAcademicYear } from '@/hooks/useAcademicYearAdmin';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { AcademicYearOption } from '@/types/lookup';

function SetCurrentButton({ year }: { year: AcademicYearOption }) {
  const { t } = useTranslation('lookups');
  const update = useUpdateAcademicYear(year.id);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={update.isPending}
      onClick={async () => {
        try {
          await update.mutateAsync({ isCurrent: true });
          toast.success(t('academicYears.setCurrentSuccess', { label: year.label }));
        } catch (error) {
          toast.error(error instanceof ApiError ? error.message : t('academicYears.setCurrentError'));
        }
      }}
    >
      {t('academicYears.setCurrent')}
    </Button>
  );
}

export function AcademicYearAdminPanel() {
  const { t } = useTranslation('lookups');
  const { t: tc } = useTranslation();
  const { data, isLoading, isError } = useAcademicYearsAdmin();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AcademicYearOption | null>(null);

  const years = [...(data ?? [])].sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">{t('panels.academicYears.title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('panels.academicYears.description')}
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          {t('academicYears.addYear')}
        </Button>
      </div>

      {isError && <p className="text-sm text-destructive">{t('page.errorTitle')}</p>}
      {isLoading && <p className="text-sm text-muted-foreground">{tc('loading')}</p>}

      {!isLoading && !isError && years.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('academicYears.empty')}</p>
      )}

      {!isLoading && !isError && years.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">{t('academicYears.columns.label')}</th>
                <th className="px-4 py-3 font-medium">{t('academicYears.columns.startDate')}</th>
                <th className="px-4 py-3 font-medium">{t('academicYears.columns.endDate')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.columns.status')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {years.map((year) => (
                <tr
                  key={year.id}
                  className={cn('border-b last:border-b-0', !year.isActive && 'bg-muted/30 text-muted-foreground')}
                >
                  <td className="px-4 py-3 font-medium">{year.label}</td>
                  <td className="px-4 py-3">{year.startDate}</td>
                  <td className="px-4 py-3">{year.endDate}</td>
                  <td className="px-4 py-3">
                    {year.isCurrent ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {t('academicYears.current')}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {t('admin.active')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setEditTarget(year)}>
                        {t('admin.edit')}
                      </Button>
                      {!year.isCurrent && <SetCurrentButton year={year} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddAcademicYearDialog open={addOpen} onOpenChange={setAddOpen} />

      {editTarget && (
        <EditAcademicYearDialog
          item={editTarget}
          open
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
        />
      )}
    </div>
  );
}
