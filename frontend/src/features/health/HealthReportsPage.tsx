import { Activity, AlertTriangle, Pill, Stethoscope, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ModuleSectionCard } from '@/components/module-ui/ModuleSectionCard';
import { ModuleStatCard } from '@/components/module-ui/ModuleStatCard';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';
import { Select } from '@/components/ui/select';
import { HealthStatusBadge } from '@/features/health/components/HealthStatusBadge';
import { SeverityBadge } from '@/features/health/components/SeverityBadge';
import { VisitDetailModal } from '@/features/health/components/VisitDetailModal';
import { formatStudentName } from '@/features/health/components/VisitHistoryPanel';
import { useHealthDashboardStats, useHealthVisit } from '@/hooks/useHealth';
import { useHealthReports } from '@/hooks/useHealthReports';
import { chartColor } from '@/lib/chartColors';
import { formatDobDisplay } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { HealthStatusStudent } from '@/types/health';

const SEVERITY_COLORS: Record<string, string> = {
  normal: '#16a34a',
  medium: '#ea580c',
  urgent: '#dc2626',
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { label?: string } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  const name = payload[0]?.payload?.label ?? label ?? '';
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{name}</p>
      <p className="tabular-nums text-muted-foreground">{value}</p>
    </div>
  );
}

function StatusStudentList({
  students,
  emptyLabel,
  fromPath,
}: {
  students: HealthStatusStudent[];
  emptyLabel: string;
  fromPath: string;
}) {
  if (students.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y rounded-lg border">
      {students.map((student) => (
        <li key={student.id}>
          <Link
            to={`/health/students/${student.id}`}
            state={{ from: fromPath }}
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
          >
            <span className="font-medium">
              {[student.firstName, student.lastName].filter(Boolean).join(' ')}
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                {student.admissionNumber}
              </span>
            </span>
            <span className="flex items-center gap-2">
              {student.standard && (
                <span className="text-xs text-muted-foreground">{student.standard}</span>
              )}
              <HealthStatusBadge status={student.healthStatus} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function HealthReportsPage() {
  const { t } = useTranslation('health');
  const location = useLocation();
  const fromPath = `${location.pathname}${location.search}`;
  const [days, setDays] = useState('30');
  const [statusList, setStatusList] = useState<'sick' | 'recovering' | null>('sick');
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  const daysNum = days ? Number(days) : undefined;
  const { data: dash, isLoading: dashLoading, isError: dashError } = useHealthDashboardStats();
  const { data, isLoading, isError } = useHealthReports(daysNum);
  const { data: selectedVisit } = useHealthVisit(selectedVisitId ?? undefined);

  const severityChartData =
    data?.visitsBySeverity
      .filter((row) => row.count > 0)
      .map((row) => ({
        ...row,
        name: row.label,
        fill: SEVERITY_COLORS[row.code] ?? chartColor(row.severityId),
      })) ?? [];

  const issueChartData = data?.topIssueTypes ?? [];
  const medicineChartData = data?.topMedicines ?? [];

  const healthStatusData =
    data?.studentsByHealthStatus.map((row, index) => ({
      ...row,
      name: t(`reports.healthStatus.${row.status}` as 'reports.healthStatus.healthy'),
      fill: chartColor(index + 2),
    })) ?? [];

  const trendData =
    data?.visitsByDay.map((row) => ({
      ...row,
      shortDate: formatDobDisplay(row.date).slice(0, 5),
    })) ?? [];

  const listStudents =
    statusList === 'sick'
      ? (dash?.sickStudents ?? [])
      : statusList === 'recovering'
        ? (dash?.recoveringStudents ?? [])
        : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t('reports.description')}</p>
        <div className="w-40">
          <label className="mb-1 block text-xs text-muted-foreground">{t('reports.period')}</label>
          <Select value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="7">{t('reports.periodOptions.7')}</option>
            <option value="30">{t('reports.periodOptions.30')}</option>
            <option value="90">{t('reports.periodOptions.90')}</option>
            <option value="">{t('reports.periodOptions.all')}</option>
          </Select>
        </div>
      </div>

      {dashError && <p className="text-destructive">{t('dashboard.error')}</p>}
      {isError && (
        <PlaceholderPanel title={t('reports.errorTitle')} description={t('reports.errorDescription')} />
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          className={cn(
            'rounded-xl text-left transition ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            statusList === 'sick' && 'ring-2 ring-rose-400',
          )}
          onClick={() => setStatusList((v) => (v === 'sick' ? null : 'sick'))}
        >
          <ModuleStatCard
            title={t('dashboard.kpis.currentlySick')}
            value={dashLoading ? '…' : (dash?.currentlySick ?? 0)}
            description={t('dashboard.kpis.clickToList')}
            icon={Activity}
            accent="rose"
          />
        </button>
        <button
          type="button"
          className={cn(
            'rounded-xl text-left transition ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            statusList === 'recovering' && 'ring-2 ring-amber-400',
          )}
          onClick={() => setStatusList((v) => (v === 'recovering' ? null : 'recovering'))}
        >
          <ModuleStatCard
            title={t('dashboard.kpis.currentlyRecovering')}
            value={dashLoading ? '…' : (dash?.currentlyRecovering ?? 0)}
            description={t('dashboard.kpis.clickToList')}
            icon={Stethoscope}
            accent="saffron"
          />
        </button>
        <ModuleStatCard
          title={t('dashboard.kpis.urgentWeek')}
          value={dashLoading ? '…' : (dash?.urgentCount ?? 0)}
          icon={AlertTriangle}
          accent="rose"
        />
        <ModuleStatCard
          title={t('dashboard.kpis.totalStudents')}
          value={dashLoading ? '…' : (dash?.totalStudents ?? 0)}
          icon={Users}
          accent="sky"
        />
      </section>

      {statusList && (
        <ModuleSectionCard
          title={
            statusList === 'sick'
              ? t('dashboard.sickListTitle')
              : t('dashboard.recoveringListTitle')
          }
          description={t('dashboard.statusListHelp')}
        >
          <StatusStudentList
            students={listStudents}
            emptyLabel={
              statusList === 'sick' ? t('dashboard.noSick') : t('dashboard.noRecovering')
            }
            fromPath={fromPath}
          />
        </ModuleSectionCard>
      )}

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
          {!dashLoading && (dash?.urgentAlerts.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">{t('dashboard.noUrgent')}</p>
          )}
          <div className="space-y-3">
            {(dash?.urgentAlerts ?? []).map((visit) => (
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
          {!dashLoading && (dash?.recentEntries.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">{t('dashboard.noRecent')}</p>
          )}
          <div className="space-y-3">
            {(dash?.recentEntries ?? []).map((visit) => (
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

      {!isError && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <ModuleStatCard
              title={t('reports.kpis.totalVisits')}
              value={isLoading ? '…' : (data?.totalVisits ?? 0)}
              description={t('reports.kpis.totalVisitsHelp')}
              icon={Stethoscope}
              accent="sky"
            />
            <ModuleStatCard
              title={t('reports.kpis.visitsMonth')}
              value={isLoading ? '…' : (data?.visitsThisMonth ?? 0)}
              icon={TrendingUp}
              accent="indigo"
            />
            <ModuleStatCard
              title={t('reports.kpis.uniqueStudents')}
              value={isLoading ? '…' : (data?.uniqueStudentsVisited ?? 0)}
              description={t('reports.kpis.uniqueStudentsHelp')}
              icon={Users}
              accent="emerald"
            />
          </section>

          <ModuleSectionCard
            title={t('reports.trend.title')}
            description={t('reports.trend.description')}
            icon={
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-md">
                <TrendingUp className="size-5" />
              </div>
            }
            headerClassName="from-sky-50/90 to-cyan-50/60 dark:from-sky-950/25 dark:to-cyan-950/20"
          >
            {!isLoading && trendData.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis dataKey="shortDate" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={28} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0]?.payload as { date: string; count: number };
                        return (
                          <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-md">
                            <p className="font-medium">{formatDobDisplay(row.date)}</p>
                            <p className="text-muted-foreground">
                              {row.count} {t('reports.visitsLabel')}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#2563eb' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </ModuleSectionCard>

          <section className="grid gap-6 xl:grid-cols-2">
            <ModuleSectionCard
              title={t('reports.bySeverity.title')}
              description={t('reports.bySeverity.description')}
              icon={
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md">
                  <Activity className="size-5" />
                </div>
              }
              headerClassName="from-rose-50/90 to-pink-50/60 dark:from-rose-950/25 dark:to-pink-950/20"
            >
              {!isLoading && severityChartData.length > 0 && (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityChartData}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {severityChartData.map((entry) => (
                          <Cell key={entry.severityId} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ModuleSectionCard>

            <ModuleSectionCard
              title={t('reports.healthStatus.title')}
              description={t('reports.healthStatus.description')}
              icon={
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                  <Stethoscope className="size-5" />
                </div>
              }
              headerClassName="from-emerald-50/90 to-teal-50/60 dark:from-emerald-950/25 dark:to-teal-950/20"
            >
              {!isLoading && healthStatusData.length > 0 && (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={healthStatusData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={28} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                        {healthStatusData.map((entry) => (
                          <Cell key={entry.status} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ModuleSectionCard>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <ModuleSectionCard
              title={t('reports.topIssues.title')}
              description={t('reports.topIssues.description')}
              icon={
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
                  <Stethoscope className="size-5" />
                </div>
              }
            >
              {!isLoading && issueChartData.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('reports.empty')}</p>
              )}
              {!isLoading && issueChartData.length > 0 && (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={issueChartData}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                        {issueChartData.map((_, index) => (
                          <Cell key={index} fill={chartColor(index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ModuleSectionCard>

            <ModuleSectionCard
              title={t('reports.topMedicines.title')}
              description={t('reports.topMedicines.description')}
              icon={
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-md">
                  <Pill className="size-5" />
                </div>
              }
            >
              {!isLoading && medicineChartData.length > 0 && (
                <>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={medicineChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10 }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={64}
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={28} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                          {medicineChartData.map((_, index) => (
                            <Cell key={index} fill={chartColor(index + 1)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 font-medium">{t('reports.topMedicines.columnMedicine')}</th>
                          <th className="py-2 font-medium text-right">{t('reports.topMedicines.columnTimes')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medicineChartData.map((row) => (
                          <tr key={row.label} className="border-b last:border-b-0">
                            <td className="py-2">{row.label}</td>
                            <td className="py-2 text-right tabular-nums">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </ModuleSectionCard>
          </section>
        </>
      )}

      <VisitDetailModal
        visit={selectedVisit ?? null}
        open={Boolean(selectedVisitId && selectedVisit)}
        onClose={() => setSelectedVisitId(null)}
      />
    </div>
  );
}
