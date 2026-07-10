import { AlertTriangle, BedDouble, CheckCircle2, ClipboardCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { HostelSectionCard } from '@/features/hostel/components/HostelSectionCard';
import { HostelStatCard } from '@/features/hostel/components/HostelStatCard';
import { useHostelOverview } from '@/hooks/useHostel';

export function HostelOverviewPage() {
  const { t } = useTranslation('hostel');
  const { data, isLoading } = useHostelOverview();

  const unallocated = data?.unallocatedStudents;
  const totalBeds = data?.occupancy.totalBeds ?? 0;
  const occupied = data?.occupancy.occupiedBeds ?? 0;
  const vacant = data?.occupancy.vacantBeds ?? 0;
  const occupancyPct = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0;

  return (
    <div className="space-y-6">
      {unallocated && unallocated.count > 0 && (
        <div className="flex gap-4 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-sm dark:border-amber-800 dark:from-amber-950/50 dark:to-orange-950/30">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-amber-950 dark:text-amber-100">
              {t('overview.unallocatedWarning', { count: unallocated.count })}
            </p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-sm text-amber-900/90 dark:text-amber-200/90">
              {unallocated.students.slice(0, 10).map((s) => (
                <li key={s.id}>
                  <Link to={`/students/${s.id}`} className="hover:underline">
                    {s.admissionNumber} — {[s.firstName, s.lastName].filter(Boolean).join(' ')}
                  </Link>
                </li>
              ))}
              {unallocated.count > 10 && (
                <li className="text-muted-foreground">
                  {t('overview.andMore', { count: unallocated.count - 10 })}
                </li>
              )}
            </ul>
            <Button asChild size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700">
              <Link to="/hostel/allocations">{t('overview.assignBeds')}</Link>
            </Button>
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HostelStatCard
          title={t('overview.kpis.totalBeds')}
          value={isLoading ? '…' : totalBeds}
          icon={BedDouble}
          accent="indigo"
        />
        <HostelStatCard
          title={t('overview.kpis.occupied')}
          value={isLoading ? '…' : occupied}
          description={totalBeds > 0 ? `${occupancyPct}% ${t('hero.filled')}` : undefined}
          icon={CheckCircle2}
          accent="emerald"
        />
        <HostelStatCard
          title={t('overview.kpis.vacant')}
          value={isLoading ? '…' : vacant}
          icon={BedDouble}
          accent="sky"
        />
        <HostelStatCard
          title={t('overview.kpis.unallocated')}
          value={isLoading ? '…' : (unallocated?.count ?? 0)}
          icon={Users}
          accent="rose"
        />
      </section>

      {totalBeds > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">{t('hero.occupancyBar')}</span>
            <span className="tabular-nums text-muted-foreground">
              {occupied} / {totalBeds}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
        </div>
      )}

      {data?.todayAttendance && (
        <HostelSectionCard
          title={t('overview.todayAttendance')}
          description={
            data.todayAttendance.hasSession
              ? t('hero.attendanceRecorded')
              : t('overview.noSessionToday')
          }
          icon={
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow">
              <ClipboardCheck className="size-5" />
            </div>
          }
        >
          {data.todayAttendance.hasSession && (
            <div className="grid gap-4 sm:grid-cols-3">
              <HostelStatCard
                title={t('reports.present')}
                value={data.todayAttendance.present}
                icon={CheckCircle2}
                accent="emerald"
              />
              <HostelStatCard
                title={t('reports.absent')}
                value={data.todayAttendance.absent}
                icon={AlertTriangle}
                accent="rose"
              />
              <HostelStatCard
                title={t('reports.notMarked')}
                value={data.todayAttendance.notMarked}
                icon={Users}
                accent="sky"
              />
            </div>
          )}
          <Button asChild size="sm" className="mt-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
            <Link to="/hostel/attendance">{t('overview.goAttendance')}</Link>
          </Button>
        </HostelSectionCard>
      )}
    </div>
  );
}
