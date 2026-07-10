import {
  CalendarDays,
  FileText,
  GraduationCap,
  // LayoutDashboard,
  UserPlus,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ModuleHeroBanner } from '@/components/module-ui/ModuleHeroBanner';
import { ModuleSectionCard } from '@/components/module-ui/ModuleSectionCard';
import { ModuleStatCard } from '@/components/module-ui/ModuleStatCard';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';
import { Button } from '@/components/ui/button';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { cn } from '@/lib/utils';

function EnrollmentRow({
  label,
  count,
  max,
  accent,
  href,
}: {
  label: string;
  count: number;
  max: number;
  accent: string;
  href?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((count / max) * 100)) : 0;
  const name = href ? (
    <Link to={href} className="truncate font-medium text-primary hover:underline">
      {label}
    </Link>
  ) : (
    <span className="truncate font-medium">{label}</span>
  );

  return (
    <div className="grid grid-cols-[minmax(0,7rem)_1fr_2.5rem] items-center gap-3 text-sm sm:grid-cols-[minmax(0,9rem)_1fr_2.75rem]">
      {name}
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', accent)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-right tabular-nums text-muted-foreground">{count}</span>
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const { t: tc } = useTranslation();
  const summary = useDashboardSummary();

  const standardRows = summary.data?.studentsByStandard ?? [];
  const categoryRows = summary.data?.studentsByCategory ?? [];
  const maxStandard = Math.max(...standardRows.map((r) => r.count), 1);
  const maxCategory = Math.max(...categoryRows.map((r) => r.count), 1);

  return (
    <div className="space-y-6">
      <ModuleHeroBanner
        // title={t('title')}
        // description={t('description')}
        // tagline={t('hero.tagline')}
        // icon={LayoutDashboard}
        module="temple"
      />

      {summary.isError && (
        <PlaceholderPanel title={t('errorTitle')} description={t('errorDescription')} />
      )}

      {!summary.isError && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <ModuleStatCard
              title={t('kpis.activeStudents')}
              value={summary.isLoading ? '…' : (summary.data?.activeStudents ?? 0)}
              description={t('kpis.totalEnrolled', {
                count: summary.data?.totalStudents ?? 0,
              })}
              icon={GraduationCap}
              accent="sky"
            />
            <ModuleStatCard
              title={t('kpis.activeStaff')}
              value={summary.isLoading ? '…' : (summary.data?.activeStaff ?? 0)}
              description={t('kpis.staffAccounts', {
                count: summary.data?.totalStaff ?? 0,
              })}
              icon={Users}
              accent="indigo"
            />
            <ModuleStatCard
              title={t('kpis.admissionsMonth')}
              value={summary.isLoading ? '…' : (summary.data?.admissionsThisMonth ?? 0)}
              icon={UserPlus}
              accent="emerald"
            />
            <ModuleStatCard
              title={t('kpis.admissionsYear')}
              value={summary.isLoading ? '…' : (summary.data?.admissionsThisAcademicYear ?? 0)}
              description={summary.data?.currentAcademicYear ?? undefined}
              icon={CalendarDays}
              accent="saffron"
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <ModuleSectionCard
              title={t('byStandard.title')}
              description={t('byStandard.description')}
              icon={
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-md">
                  <GraduationCap className="size-5" />
                </div>
              }
              headerClassName="from-sky-50/90 to-cyan-50/60 dark:from-sky-950/25 dark:to-cyan-950/20"
            >
              {summary.isLoading && (
                <p className="text-sm text-muted-foreground">{tc('loading')}</p>
              )}
              {!summary.isLoading && standardRows.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('byStandard.empty')}</p>
              )}
              {!summary.isLoading && standardRows.length > 0 && (
                <div className="space-y-3.5">
                  {standardRows.map((row) => (
                    <EnrollmentRow
                      key={row.standardId}
                      label={row.label}
                      count={row.count}
                      max={maxStandard}
                      accent="bg-gradient-to-r from-sky-500 to-cyan-500"
                      href={`/students?standardId=${row.standardId}&status=Active`}
                    />
                  ))}
                </div>
              )}
            </ModuleSectionCard>

            <ModuleSectionCard
              title={t('byCategory.title')}
              description={t('byCategory.description')}
              icon={
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
                  <Users className="size-5" />
                </div>
              }
              headerClassName="from-indigo-50/90 to-violet-50/60 dark:from-indigo-950/25 dark:to-violet-950/20"
            >
              {summary.isLoading && (
                <p className="text-sm text-muted-foreground">{tc('loading')}</p>
              )}
              {!summary.isLoading && categoryRows.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('byCategory.empty')}</p>
              )}
              {!summary.isLoading && categoryRows.length > 0 && (
                <div className="space-y-3.5">
                  {categoryRows.map((row) => (
                    <EnrollmentRow
                      key={row.categoryId}
                      label={row.label}
                      count={row.count}
                      max={maxCategory}
                      accent="bg-gradient-to-r from-indigo-500 to-violet-600"
                    />
                  ))}
                </div>
              )}
            </ModuleSectionCard>
          </section>

          <div className="flex flex-col gap-4 rounded-xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-teal-50/80 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-teal-950/20">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <FileText className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">{t('documents.title')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('documents.description')}</p>
              </div>
            </div>
            <Button asChild className="shrink-0 bg-emerald-600 hover:bg-emerald-700">
              <Link to="/documents">{t('documents.cta')}</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
