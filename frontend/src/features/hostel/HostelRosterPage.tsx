import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HostelDateBlockFilters, useHostelDateFilters } from '@/features/hostel/components/HostelDateBlockFilters';
import { useHostelDailyReport } from '@/hooks/useHostel';
import { usePhase2Lookups } from '@/hooks/usePhase2Lookups';
import type { HostelDailyReport, HostelDailyReportRow } from '@/types/hostel';
import { cn } from '@/lib/utils';

const STATUS_FILTER_ALL = 'all';
const STATUS_FILTER_NOT_MARKED = 'not_marked';

function combineRoster(daily: HostelDailyReport): HostelDailyReportRow[] {
  return [...daily.present, ...daily.absent, ...daily.notMarked];
}

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

function statusBadgeClass(status: string | null, countsAsPresent: boolean | null): string {
  if (countsAsPresent === null) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  if (status === 'Late') return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200';
  if (status === 'On Leave') return 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200';
  if (countsAsPresent) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200';
  return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
}

function countForFilter(roster: HostelDailyReportRow[], filterValue: string): number {
  if (filterValue === STATUS_FILTER_ALL) return roster.length;
  if (filterValue === STATUS_FILTER_NOT_MARKED) {
    return roster.filter((r) => r.countsAsPresent === null).length;
  }
  return roster.filter((r) => r.status?.toLowerCase() === filterValue.toLowerCase()).length;
}

export function HostelRosterPage() {
  const { t } = useTranslation('hostel');
  const { date, blockFilter, status, search, sessionPeriod, setFilters } = useHostelDateFilters();
  const { hostelAttendanceStatuses } = usePhase2Lookups();
  const { data: daily, isLoading } = useHostelDailyReport(date, blockFilter, sessionPeriod);

  const roster = useMemo(() => (daily ? combineRoster(daily) : []), [daily]);

  const filtered = useMemo(() => {
    let rows = roster;

    if (status === STATUS_FILTER_NOT_MARKED) {
      rows = rows.filter((r) => r.countsAsPresent === null);
    } else if (status !== STATUS_FILTER_ALL) {
      rows = rows.filter((r) => r.status?.toLowerCase() === status.toLowerCase());
    }

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.admissionNumber.toLowerCase().includes(q) ||
          r.firstName.toLowerCase().includes(q) ||
          (r.lastName?.toLowerCase().includes(q) ?? false),
      );
    }

    return rows.sort((a, b) => a.admissionNumber.localeCompare(b.admissionNumber));
  }, [roster, status, search]);

  const statusFilters = [
    { value: STATUS_FILTER_ALL, label: t('roster.filters.all') },
    { value: STATUS_FILTER_NOT_MARKED, label: t('reports.notMarked') },
    ...hostelAttendanceStatuses.map((s) => ({ value: s.value, label: s.value })),
  ];

  return (
    <div className="space-y-4">
      <HostelDateBlockFilters idPrefix="hostel-roster" />

      <div className="flex flex-wrap gap-2">
        {(['morning', 'evening'] as const).map((period) => (
          <button
            key={period}
            type="button"
            onClick={() => setFilters({ sessionPeriod: period })}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
              sessionPeriod === period
                ? period === 'morning'
                  ? 'border-amber-400 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'border-indigo-400 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'bg-background text-muted-foreground hover:border-orange-300 hover:text-foreground',
            )}
          >
            {period === 'morning' ? t('attendance.morning') : t('attendance.evening')}
          </button>
        ))}
      </div>

      {!daily?.hasSession && !isLoading && (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {t('roster.noSessionForPeriod')}{' '}
          <Link to="/hostel/attendance" className="text-primary underline underline-offset-2">
            {t('overview.goAttendance')}
          </Link>
        </p>
      )}

      {(daily || isLoading) && (
        <>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilters({ status: f.value })}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm transition-colors',
                  status === f.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
                )}
              >
                {f.label}
                {!isLoading && daily && (
                  <span className="ml-1.5 tabular-nums opacity-80">
                    ({countForFilter(roster, f.value)})
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="max-w-sm">
            <Label htmlFor="hostel-roster-search">{t('roster.search')}</Label>
            <Input
              id="hostel-roster-search"
              placeholder={t('roster.searchPlaceholder')}
              value={search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </div>

          {isLoading && <p className="text-sm text-muted-foreground">{t('reports.loading')}</p>}

          {!isLoading && roster.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t('roster.showing', { count: filtered.length, total: roster.length })}
            </p>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-3 py-2">{t('roster.columns.admission')}</th>
                    <th className="px-3 py-2">{t('attendance.columns.student')}</th>
                    <th className="px-3 py-2">{t('attendance.columns.room')}</th>
                    <th className="px-3 py-2">{t('attendance.columns.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.studentId} className="border-t">
                      <td className="px-3 py-2">
                        <Link
                          to={`/students/${row.studentId}`}
                          className="font-mono text-primary underline underline-offset-2 hover:text-primary/80"
                        >
                          {row.admissionNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-2">{formatName(row.firstName, row.lastName)}</td>
                  <td className="px-3 py-2">
                    {row.isAssigned === false ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        {t('attendance.unassigned')}
                      </span>
                    ) : (
                      <>
                        {row.blockName} / {row.roomNumber}
                        {row.bedSlot != null && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({t('beds.slot', { number: row.bedSlot })})
                          </span>
                        )}
                      </>
                    )}
                  </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                            statusBadgeClass(row.status, row.countsAsPresent),
                          )}
                        >
                          {row.status ?? t('reports.notMarked')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">{t('roster.empty')}</p>
          )}
        </>
      )}
    </div>
  );
}
