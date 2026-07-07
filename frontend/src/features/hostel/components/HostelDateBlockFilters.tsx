import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHostelBlocks } from '@/hooks/useHostel';

export function useHostelDateFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const today = new Date().toISOString().slice(0, 10);
  const date = searchParams.get('date') ?? today;
  const blockId = searchParams.get('blockId') ?? '';
  const status = searchParams.get('status') ?? 'all';
  const search = searchParams.get('search') ?? '';

  const blockFilter = blockId ? Number(blockId) : undefined;

  const setFilters = (next: Partial<{ date: string; blockId: string; status: string; search: string }>) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value === '' || value === undefined) params.delete(key);
      else params.set(key, value);
    }
    setSearchParams(params, { replace: true });
  };

  return { date, blockId, status, search, blockFilter, setFilters, today };
}

type HostelDateBlockFiltersProps = {
  idPrefix?: string;
};

export function HostelDateBlockFilters({ idPrefix = 'hostel' }: HostelDateBlockFiltersProps) {
  const { t } = useTranslation('hostel');
  const { date, blockId, blockFilter, setFilters, today } = useHostelDateFilters();
  const { data: blocksData } = useHostelBlocks();
  const blocks = blocksData?.data ?? [];

  const [draftDate, draftBlockId] = useMemo(() => [date, blockId], [date, blockId]);

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const nextDate = (form.elements.namedItem('date') as HTMLInputElement).value;
        const nextBlockId = (form.elements.namedItem('blockId') as HTMLSelectElement).value;
        setFilters({ date: nextDate || today, blockId: nextBlockId });
      }}
    >
      <div>
        <Label htmlFor={`${idPrefix}-date`}>{t('reports.date')}</Label>
        <Input
          id={`${idPrefix}-date`}
          name="date"
          type="date"
          defaultValue={draftDate}
          key={`${idPrefix}-date-${draftDate}`}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-block`}>{t('reports.block')}</Label>
        <select
          id={`${idPrefix}-block`}
          name="blockId"
          className="flex h-10 min-w-[160px] rounded-md border bg-background px-3 text-sm"
          defaultValue={draftBlockId}
          key={`${idPrefix}-block-${draftBlockId}`}
        >
          <option value="">{t('attendance.allBlocks')}</option>
          {blocks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit">{t('reports.apply')}</Button>
      {blockFilter !== undefined && (
        <p className="text-xs text-muted-foreground">{t('reports.filters.blockActive')}</p>
      )}
    </form>
  );
}

/** @deprecated Use useHostelDateFilters */
export const useHostelReportFilters = useHostelDateFilters;

/** @deprecated Use HostelDateBlockFilters */
export const HostelReportsFilters = HostelDateBlockFilters;
