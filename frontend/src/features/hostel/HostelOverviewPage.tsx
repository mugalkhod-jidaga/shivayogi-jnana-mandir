import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import { useHostelOverview } from '@/hooks/useHostel';

export function HostelOverviewPage() {
  const { t } = useTranslation('hostel');
  const { data, isLoading } = useHostelOverview();

  const unallocated = data?.unallocatedStudents;

  return (
    <div className="space-y-6">
      {unallocated && unallocated.count > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="font-medium text-amber-900 dark:text-amber-200">
            {t('overview.unallocatedWarning', { count: unallocated.count })}
          </p>
          <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-sm text-amber-800 dark:text-amber-300">
            {unallocated.students.slice(0, 10).map((s) => (
              <li key={s.id}>
                <Link to={`/students/${s.id}`} className="hover:underline">
                  {s.admissionNumber} — {[s.firstName, s.lastName].filter(Boolean).join(' ')}
                </Link>
              </li>
            ))}
            {unallocated.count > 10 && (
              <li className="text-muted-foreground">{t('overview.andMore', { count: unallocated.count - 10 })}</li>
            )}
          </ul>
          <Button asChild size="sm" className="mt-3" variant="outline">
            <Link to="/hostel/allocations">{t('overview.assignBeds')}</Link>
          </Button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={t('overview.kpis.totalBeds')}
          value={isLoading ? '…' : (data?.occupancy.totalBeds ?? 0)}
        />
        <KpiCard
          title={t('overview.kpis.occupied')}
          value={isLoading ? '…' : (data?.occupancy.occupiedBeds ?? 0)}
        />
        <KpiCard
          title={t('overview.kpis.vacant')}
          value={isLoading ? '…' : (data?.occupancy.vacantBeds ?? 0)}
        />
        <KpiCard
          title={t('overview.kpis.unallocated')}
          value={isLoading ? '…' : (unallocated?.count ?? 0)}
          className={unallocated && unallocated.count > 0 ? 'border-amber-200' : undefined}
        />
      </section>

      {data?.todayAttendance && (
        <section className="rounded-lg border p-4">
          <h2 className="font-medium">{t('overview.todayAttendance')}</h2>
          {!data.todayAttendance.hasSession && (
            <p className="mt-2 text-sm text-muted-foreground">{t('overview.noSessionToday')}</p>
          )}
          {data.todayAttendance.hasSession && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <KpiCard title={t('reports.present')} value={data.todayAttendance.present} />
              <KpiCard title={t('reports.absent')} value={data.todayAttendance.absent} />
              <KpiCard title={t('reports.notMarked')} value={data.todayAttendance.notMarked} />
            </div>
          )}
          <Button asChild size="sm" className="mt-4" variant="outline">
            <Link to="/hostel/attendance">{t('overview.goAttendance')}</Link>
          </Button>
        </section>
      )}
    </div>
  );
}
