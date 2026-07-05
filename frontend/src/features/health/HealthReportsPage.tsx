import { Activity, Pill, Stethoscope, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { PageHeader } from '@/components/PageHeader';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import { useHealthReports } from '@/hooks/useHealthReports';
import { chartColor } from '@/lib/chartColors';
import { formatDobDisplay } from '@/lib/date';

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

export function HealthReportsPage() {
  const { t } = useTranslation('health');
  const { data, isLoading, isError } = useHealthReports();

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

  return (
    <div className="space-y-6">
      <PageHeader title={t('reports.title')} description={t('reports.description')} />

      {isError && (
        <PlaceholderPanel title={t('reports.errorTitle')} description={t('reports.errorDescription')} />
      )}

      {!isError && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title={t('reports.kpis.totalVisits')}
              value={isLoading ? '…' : (data?.totalVisits ?? 0)}
              description={t('reports.kpis.totalVisitsHelp')}
              className="border-l-4 border-l-blue-500"
            />
            <KpiCard
              title={t('reports.kpis.visitsMonth')}
              value={isLoading ? '…' : (data?.visitsThisMonth ?? 0)}
              className="border-l-4 border-l-violet-500"
            />
            <KpiCard
              title={t('reports.kpis.visitsWeek')}
              value={isLoading ? '…' : (data?.visitsThisWeek ?? 0)}
              className="border-l-4 border-l-amber-500"
            />
            <KpiCard
              title={t('reports.kpis.uniqueStudents')}
              value={isLoading ? '…' : (data?.uniqueStudentsVisited ?? 0)}
              description={t('reports.kpis.uniqueStudentsHelp')}
              className="border-l-4 border-l-emerald-500"
            />
          </section>

          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-blue-600" />
              <h2 className="text-lg font-semibold">{t('reports.trend.title')}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t('reports.trend.description')}</p>
            {!isLoading && trendData.length > 0 && (
              <div className="mt-6 h-64">
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
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Activity className="size-5 text-red-600" />
                <h2 className="text-lg font-semibold">{t('reports.bySeverity.title')}</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t('reports.bySeverity.description')}</p>
              {!isLoading && severityChartData.length > 0 && (
                <div className="mt-6 h-56">
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
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Stethoscope className="size-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">{t('reports.healthStatus.title')}</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t('reports.healthStatus.description')}</p>
              {!isLoading && healthStatusData.length > 0 && (
                <div className="mt-6 h-56">
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
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Stethoscope className="size-5 text-violet-600" />
                <h2 className="text-lg font-semibold">{t('reports.topIssues.title')}</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t('reports.topIssues.description')}</p>
              {!isLoading && issueChartData.length === 0 && (
                <p className="mt-6 text-sm text-muted-foreground">{t('reports.empty')}</p>
              )}
              {!isLoading && issueChartData.length > 0 && (
                <div className="mt-6 h-72">
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
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Pill className="size-5 text-blue-600" />
                <h2 className="text-lg font-semibold">{t('reports.topMedicines.title')}</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t('reports.topMedicines.description')}</p>
              {!isLoading && medicineChartData.length > 0 && (
                <>
                  <div className="mt-6 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={medicineChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={64} />
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
            </div>
          </section>
        </>
      )}
    </div>
  );
}
