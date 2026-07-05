import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import { SeverityBadge } from '@/features/health/components/SeverityBadge';
import { formatStudentName } from '@/features/health/components/VisitHistoryPanel';
import { useHealthDashboardStats } from '@/hooks/useHealth';

export function HealthDashboardPage() {
  const { t } = useTranslation('health');
  const { data, isLoading, isError } = useHealthDashboardStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />
        <Button asChild>
          <Link to="/health/record-visit">{t('recent.recordVisit')}</Link>
        </Button>
      </div>

      {isError && <p className="text-destructive">{t('dashboard.error')}</p>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={t('dashboard.kpis.totalStudents')}
          value={isLoading ? '…' : (data?.totalStudents ?? 0)}
        />
        <KpiCard
          title={t('dashboard.kpis.sickToday')}
          value={isLoading ? '…' : (data?.sickToday ?? 0)}
          className="border-amber-200"
        />
        <KpiCard
          title={t('dashboard.kpis.urgentWeek')}
          value={isLoading ? '…' : (data?.urgentCount ?? 0)}
          className="border-red-200"
        />
        <KpiCard
          title={t('dashboard.kpis.visitsWeek')}
          value={isLoading ? '…' : (data?.visitsThisWeek ?? 0)}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold text-red-700">{t('dashboard.urgentAlerts')}</h2>
          {!isLoading && (data?.urgentAlerts.length ?? 0) === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">{t('dashboard.noUrgent')}</p>
          )}
          <div className="mt-3 space-y-3">
            {(data?.urgentAlerts ?? []).map((visit) => (
              <article key={visit.id} className="rounded-md border border-red-100 bg-red-50/50 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{formatStudentName(visit)}</span>
                  <span className="text-muted-foreground">{visit.visitDate}</span>
                  <SeverityBadge code={visit.severity.code} label={visit.severity.value} />
                </div>
                <p className="mt-1">{visit.issueType}</p>
                <p className="line-clamp-2 text-muted-foreground">{visit.symptoms}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">{t('dashboard.recentEntries')}</h2>
          {!isLoading && (data?.recentEntries.length ?? 0) === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">{t('dashboard.noRecent')}</p>
          )}
          <div className="mt-3 space-y-3">
            {(data?.recentEntries ?? []).map((visit) => (
              <article key={visit.id} className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{formatStudentName(visit)}</span>
                  <span className="text-muted-foreground">{visit.visitDate}</span>
                  <SeverityBadge code={visit.severity.code} label={visit.severity.value} />
                </div>
                <p className="mt-1">{visit.issueType}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
