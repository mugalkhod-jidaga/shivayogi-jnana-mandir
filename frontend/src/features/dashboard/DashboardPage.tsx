import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import { useDashboardSummary } from '@/hooks/useDashboard';

export function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const { t: tc } = useTranslation();
  const summary = useDashboardSummary();

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      {summary.isError && (
        <PlaceholderPanel title={t('errorTitle')} description={t('errorDescription')} />
      )}

      {!summary.isError && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <KpiCard
              title={t('kpis.activeStudents')}
              value={summary.isLoading ? '…' : (summary.data?.activeStudents ?? 0)}
              description={t('kpis.totalEnrolled', {
                count: summary.data?.totalStudents ?? 0,
              })}
            />
            <KpiCard
              title={t('kpis.activeStaff')}
              value={summary.isLoading ? '…' : (summary.data?.activeStaff ?? 0)}
              description={t('kpis.staffAccounts', {
                count: summary.data?.totalStaff ?? 0,
              })}
            />
            <KpiCard
              title={t('kpis.admissionsMonth')}
              value={summary.isLoading ? '…' : (summary.data?.admissionsThisMonth ?? 0)}
            />
            <KpiCard
              title={t('kpis.admissionsYear')}
              value={summary.isLoading ? '…' : (summary.data?.admissionsThisAcademicYear ?? 0)}
              description={summary.data?.currentAcademicYear ?? undefined}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border p-6">
              <h2 className="text-lg font-medium">{t('byStandard.title')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('byStandard.description')}</p>
              {summary.isLoading && (
                <p className="mt-4 text-sm text-muted-foreground">{tc('loading')}</p>
              )}
              {!summary.isLoading && (summary.data?.studentsByStandard.length ?? 0) === 0 && (
                <p className="mt-4 text-sm text-muted-foreground">{t('byStandard.empty')}</p>
              )}
              {!summary.isLoading && (summary.data?.studentsByStandard.length ?? 0) > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 font-medium">{t('byStandard.columnStandard')}</th>
                        <th className="py-2 font-medium text-right">
                          {t('byStandard.columnStudents')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.data?.studentsByStandard.map((row) => (
                        <tr key={row.standardId} className="border-b last:border-b-0">
                          <td className="py-2">{row.label}</td>
                          <td className="py-2 text-right tabular-nums">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-lg border p-6">
              <h2 className="text-lg font-medium">{t('byCategory.title')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('byCategory.description')}</p>
              {summary.isLoading && (
                <p className="mt-4 text-sm text-muted-foreground">{tc('loading')}</p>
              )}
              {!summary.isLoading && (summary.data?.studentsByCategory.length ?? 0) === 0 && (
                <p className="mt-4 text-sm text-muted-foreground">{t('byCategory.empty')}</p>
              )}
              {!summary.isLoading && (summary.data?.studentsByCategory.length ?? 0) > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 font-medium">{t('byCategory.columnCategory')}</th>
                        <th className="py-2 font-medium text-right">
                          {t('byCategory.columnStudents')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.data?.studentsByCategory.map((row) => (
                        <tr key={row.categoryId} className="border-b last:border-b-0">
                          <td className="py-2">{row.label}</td>
                          <td className="py-2 text-right tabular-nums">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border p-6">
            <h2 className="text-lg font-medium">{t('documents.title')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('documents.description')}</p>
            <Link
              to="/documents"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              {t('documents.cta')}
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
