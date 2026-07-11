import { HeartPulse, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { AcademicStandardSelect } from '@/components/lookups/AcademicStandardSelect';
import { RequirePermission } from '@/components/RequirePermission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SeverityBadge } from '@/features/health/components/SeverityBadge';
import { VisitDetailModal } from '@/features/health/components/VisitDetailModal';
import { formatStudentName } from '@/features/health/components/VisitHistoryPanel';
import {
  useHealthVisit,
  useHealthVisitsList,
  useUpdateStudentHealthStatus,
} from '@/hooks/useHealth';
import { useHealthLookups } from '@/hooks/useHealthLookups';

export function VisitsPage() {
  const { t } = useTranslation('health');
  const { t: tc } = useTranslation();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { severities } = useHealthLookups();
  const returnTo = `${location.pathname}${location.search}`;
  const updateHealthStatus = useUpdateStudentHealthStatus();
  const [recoveringId, setRecoveringId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const page = Number(searchParams.get('page') ?? '1');
  const searchParam = searchParams.get('search') ?? '';
  const severityParam = searchParams.get('severityId') ?? '';
  const standardParam = searchParams.get('standardId') ?? '';
  const fromParam = searchParams.get('from') ?? '';
  const toParam = searchParams.get('to') ?? '';

  const [searchInput, setSearchInput] = useState(searchParam);
  const [severityFilter, setSeverityFilter] = useState(severityParam);
  const [standardFilter, setStandardFilter] = useState(standardParam);
  const [fromFilter, setFromFilter] = useState(fromParam);
  const [toFilter, setToFilter] = useState(toParam);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  useEffect(() => {
    setSearchInput(searchParam);
    setSeverityFilter(severityParam);
    setStandardFilter(standardParam);
    setFromFilter(fromParam);
    setToFilter(toParam);
  }, [searchParam, severityParam, standardParam, fromParam, toParam]);

  const hasActiveFilters = Boolean(
    searchParam || severityParam || standardParam || fromParam || toParam,
  );

  const { data, isLoading, isError } = useHealthVisitsList({
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: 20,
    search: searchParam || undefined,
    severityId: severityParam ? Number(severityParam) : undefined,
    standardId: standardParam ? Number(standardParam) : undefined,
    from: fromParam || undefined,
    to: toParam || undefined,
  });
  const { data: selectedVisit } = useHealthVisit(selectedVisitId ?? undefined);

  const visits = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  const applyFilters = () => {
    const next = new URLSearchParams();
    if (searchInput.trim()) next.set('search', searchInput.trim());
    if (severityFilter) next.set('severityId', severityFilter);
    if (standardFilter) next.set('standardId', standardFilter);
    if (fromFilter) next.set('from', fromFilter);
    if (toFilter) next.set('to', toFilter);
    next.set('page', '1');
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSeverityFilter('');
    setStandardFilter('');
    setFromFilter('');
    setToFilter('');
    setSearchParams(new URLSearchParams({ page: '1' }));
  };

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  };

  const handleMarkRecovered = async (studentId: string) => {
    setActionError(null);
    setRecoveringId(studentId);
    try {
      await updateHealthStatus.mutateAsync({ studentId, healthStatus: 'healthy' });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('profile.markRecoveredFailed'));
    } finally {
      setRecoveringId(null);
    }
  };

  const recordVisitButton = (
    <RequirePermission permission="medical:create">
      <Button asChild size="lg" className="bg-teal-600 shadow-md hover:bg-teal-700">
        <Link to="/health/record-visit" className="gap-2">
          <HeartPulse className="size-5" />
          {t('visits.recordVisit')}
        </Link>
      </Button>
    </RequirePermission>
  );

  return (
    <div className="space-y-6 pb-24 sm:pb-0">
      <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 border-b border-teal-100/80 bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 dark:border-teal-900/40">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{t('visits.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('visits.description')}</p>
        </div>
        <div className="hidden sm:block">{recordVisitButton}</div>
      </div>

      <form
        className="space-y-3 rounded-xl border border-teal-200/50 bg-gradient-to-br from-teal-50/40 to-cyan-50/30 p-4 dark:border-teal-900/30 dark:from-teal-950/20 dark:to-cyan-950/15"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters();
        }}
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('visits.searchPlaceholder')}
              className="pl-9"
            />
          </div>
          <Button type="submit">{tc('actions.apply')}</Button>
          {hasActiveFilters && (
            <Button type="button" variant="outline" onClick={clearFilters}>
              {t('visits.clearFilters')}
            </Button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="">{t('visits.allSeverities')}</option>
            {severities.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.value}
              </option>
            ))}
          </Select>
          <AcademicStandardSelect
            value={standardFilter}
            onChange={setStandardFilter}
            placeholder={t('visits.allClasses')}
          />
          <Input
            type="date"
            value={fromFilter}
            onChange={(e) => setFromFilter(e.target.value)}
            aria-label={t('visits.fromDate')}
          />
          <Input
            type="date"
            value={toFilter}
            onChange={(e) => setToFilter(e.target.value)}
            aria-label={t('visits.toDate')}
          />
        </div>
      </form>

      {isError && <p className="text-sm text-destructive">{t('visits.error')}</p>}
      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <div className="overflow-x-auto rounded-xl border border-teal-100 shadow-sm dark:border-teal-900/30">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-gradient-to-r from-teal-50/80 to-cyan-50/60 text-left dark:from-teal-950/40 dark:to-cyan-950/20">
            <tr>
              <th className="px-4 py-3 font-medium">{t('visits.columns.date')}</th>
              <th className="px-4 py-3 font-medium">{t('visits.columns.student')}</th>
              <th className="px-4 py-3 font-medium">{t('visits.columns.severity')}</th>
              <th className="px-4 py-3 font-medium">{t('visits.columns.issue')}</th>
              <th className="px-4 py-3 font-medium">{t('visits.columns.medicines')}</th>
              <th className="px-4 py-3 font-medium">{t('visits.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {t('loading')}
                </td>
              </tr>
            )}

            {!isLoading && visits.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {hasActiveFilters ? t('visits.emptyFiltered') : t('visits.empty')}
                  {hasActiveFilters && (
                    <div className="mt-3">
                      <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                        {t('visits.clearFilters')}
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            )}

            {visits.map((visit) => {
              const medicineSummary = visit.medicines.map((m) => m.medicineName).join(', ');
              const canRecover =
                visit.student.healthStatus === 'sick' || visit.student.healthStatus === 'recovering';
              const isRecovering = recoveringId === visit.studentId;

              return (
                <tr
                  key={visit.id}
                  className="cursor-pointer border-t transition-colors hover:bg-teal-50/50 dark:hover:bg-teal-950/20"
                  onClick={() => setSelectedVisitId(visit.id)}
                >
                  <td className="whitespace-nowrap px-4 py-3">{visit.visitDate}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/students/${visit.studentId}?tab=health`}
                      state={{ from: returnTo }}
                      className="font-medium text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {formatStudentName(visit)}
                    </Link>
                    <p className="mt-0.5">
                      <Link
                        to={`/health/students/${visit.studentId}`}
                        state={{ from: returnTo }}
                        className="font-mono text-xs text-muted-foreground hover:text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {visit.student.admissionNumber}
                      </Link>
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge code={visit.severity.code} label={visit.severity.value} />
                  </td>
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="truncate font-medium">{visit.issueType}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{visit.symptoms}</p>
                  </td>
                  <td className="max-w-[180px] px-4 py-3 text-muted-foreground">
                    <p className="truncate" title={medicineSummary || undefined}>
                      {medicineSummary || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {canRecover ? (
                      <RequirePermission permission="medical:create">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isRecovering || updateHealthStatus.isPending}
                          onClick={() => void handleMarkRecovered(visit.studentId)}
                        >
                          {isRecovering
                            ? t('profile.markingRecovered')
                            : t('profile.markRecovered')}
                        </Button>
                      </RequirePermission>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {meta && meta.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            {t('visits.pageOf', {
              page: meta.page,
              totalPages,
              total: meta.total,
            })}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => goToPage(meta.page - 1)}
            >
              {tc('actions.previous')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page >= totalPages}
              onClick={() => goToPage(meta.page + 1)}
            >
              {tc('actions.next')}
            </Button>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-teal-200/60 bg-background/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden dark:border-teal-900/50">
        <div className="[&_a]:w-full [&_button]:w-full">{recordVisitButton}</div>
      </div>

      <VisitDetailModal
        visit={selectedVisit ?? null}
        open={Boolean(selectedVisitId && selectedVisit)}
        onClose={() => setSelectedVisitId(null)}
      />
    </div>
  );
}
