import { Activity, AlertTriangle, Stethoscope, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModuleSectionCard } from '@/components/module-ui/ModuleSectionCard';
import { ModuleStatCard } from '@/components/module-ui/ModuleStatCard';
import { SeverityBadge } from '@/features/health/components/SeverityBadge';
import { VisitDetailModal } from '@/features/health/components/VisitDetailModal';
import { formatStudentName } from '@/features/health/components/VisitHistoryPanel';
import { useHealthDashboardStats, useHealthVisit } from '@/hooks/useHealth';

export function HealthDashboardPage() {
  const { t } = useTranslation('health');
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const { data, isLoading, isError } = useHealthDashboardStats();
  const { data: selectedVisit } = useHealthVisit(selectedVisitId ?? undefined);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t('dashboard.description')}</p>

      {isError && <p className="text-destructive">{t('dashboard.error')}</p>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ModuleStatCard
          title={t('dashboard.kpis.totalStudents')}
          value={isLoading ? '…' : (data?.totalStudents ?? 0)}
          icon={Users}
          accent="sky"
        />
        <ModuleStatCard
          title={t('dashboard.kpis.sickToday')}
          value={isLoading ? '…' : (data?.sickToday ?? 0)}
          icon={Activity}
          accent="saffron"
        />
        <ModuleStatCard
          title={t('dashboard.kpis.urgentWeek')}
          value={isLoading ? '…' : (data?.urgentCount ?? 0)}
          icon={AlertTriangle}
          accent="rose"
        />
        <ModuleStatCard
          title={t('dashboard.kpis.visitsWeek')}
          value={isLoading ? '…' : (data?.visitsThisWeek ?? 0)}
          icon={Stethoscope}
          accent="emerald"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ModuleSectionCard
          title={t('dashboard.urgentAlerts')}
          headerClassName="from-rose-50/90 to-pink-50/60 dark:from-rose-950/25 dark:to-pink-950/20"
          icon={
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md">
              <AlertTriangle className="size-5" />
            </div>
          }
        >
          {!isLoading && (data?.urgentAlerts.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">{t('dashboard.noUrgent')}</p>
          )}
          <div className="space-y-3">
            {(data?.urgentAlerts ?? []).map((visit) => (
              <button
                key={visit.id}
                type="button"
                className="w-full rounded-lg border border-rose-100 bg-rose-50/50 p-3 text-left text-sm transition-colors hover:bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/20"
                onClick={() => setSelectedVisitId(visit.id)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{formatStudentName(visit)}</span>
                  <span className="text-muted-foreground">{visit.visitDate}</span>
                  <SeverityBadge code={visit.severity.code} label={visit.severity.value} />
                </div>
                <p className="mt-1">{visit.issueType}</p>
                <p className="line-clamp-2 text-muted-foreground">{visit.symptoms}</p>
              </button>
            ))}
          </div>
        </ModuleSectionCard>

        <ModuleSectionCard
          title={t('dashboard.recentEntries')}
          headerClassName="from-teal-50/90 to-emerald-50/60 dark:from-teal-950/25 dark:to-emerald-950/20"
          icon={
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md">
              <Stethoscope className="size-5" />
            </div>
          }
        >
          {!isLoading && (data?.recentEntries.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">{t('dashboard.noRecent')}</p>
          )}
          <div className="space-y-3">
            {(data?.recentEntries ?? []).map((visit) => (
              <button
                key={visit.id}
                type="button"
                className="w-full rounded-lg border p-3 text-left text-sm transition-colors hover:bg-teal-50/50 dark:hover:bg-teal-950/20"
                onClick={() => setSelectedVisitId(visit.id)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{formatStudentName(visit)}</span>
                  <span className="text-muted-foreground">{visit.visitDate}</span>
                  <SeverityBadge code={visit.severity.code} label={visit.severity.value} />
                </div>
                <p className="mt-1">{visit.issueType}</p>
              </button>
            ))}
          </div>
        </ModuleSectionCard>
      </section>

      <VisitDetailModal
        visit={selectedVisit ?? null}
        open={Boolean(selectedVisitId && selectedVisit)}
        onClose={() => setSelectedVisitId(null)}
      />
    </div>
  );
}
