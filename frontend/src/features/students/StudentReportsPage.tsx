import { GraduationCap, PieChartIcon, TrendingUp, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
import { useStudentReports } from '@/hooks/useStudentReports';
import { CHART_COLORS, chartColor } from '@/lib/chartColors';
import { genderLabel } from '@/lib/enumLabels';

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: { label?: string } }>;
  label?: string;
};

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  const name = payload[0]?.payload?.label ?? label ?? payload[0]?.name ?? '';
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{name}</p>
      <p className="tabular-nums text-muted-foreground">{value} students</p>
    </div>
  );
}

export function StudentReportsPage() {
  const { t } = useTranslation('students');
  const { t: tc } = useTranslation();
  const { data, isLoading, isError } = useStudentReports();

  const standardChartData =
    data?.studentsByStandard
      .filter((row) => row.count > 0)
      .map((row) => ({ ...row, name: row.label })) ?? [];

  const socialChartData =
    data?.studentsBySocialCategory
      .filter((row) => row.count > 0)
      .map((row, index) => ({
        ...row,
        name: row.label,
        fill: chartColor(index),
      })) ?? [];

  const genderChartData =
    data?.studentsByGender
      .filter((row) => row.count > 0)
      .map((row, index) => ({
        ...row,
        name: genderLabel(tc, row.gender as 'Male' | 'Female' | 'Other'),
        fill: chartColor(index),
      })) ?? [];

  const statusChartData =
    data?.studentsByStatus
      .filter((row) => row.count > 0)
      .map((row, index) => ({
        ...row,
        name: tc(`status.${row.status.toLowerCase()}` as 'status.active'),
        fill: chartColor(index + 3),
      })) ?? [];

  const totalSocial = socialChartData.reduce((sum, row) => sum + row.count, 0);

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
              title={t('reports.kpis.activeStudents')}
              value={isLoading ? '…' : (data?.activeStudents ?? 0)}
              description={t('reports.kpis.totalEnrolled', { count: data?.totalStudents ?? 0 })}
              className="border-l-4 border-l-blue-500"
            />
            <KpiCard
              title={t('reports.kpis.admissionsYear')}
              value={isLoading ? '…' : (data?.admissionsThisAcademicYear ?? 0)}
              description={data?.currentAcademicYear ?? undefined}
              className="border-l-4 border-l-violet-500"
            />
            <KpiCard
              title={t('reports.kpis.standards')}
              value={isLoading ? '…' : standardChartData.length}
              description={t('reports.kpis.standardsHelp')}
              className="border-l-4 border-l-emerald-500"
            />
            <KpiCard
              title={t('reports.kpis.socialCategories')}
              value={isLoading ? '…' : socialChartData.length}
              description={t('reports.kpis.socialCategoriesHelp')}
              className="border-l-4 border-l-amber-500"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="size-5 text-blue-600" />
                    <h2 className="text-lg font-semibold">{t('reports.byStandard.title')}</h2>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('reports.byStandard.description')}
                  </p>
                </div>
              </div>

              {isLoading && (
                <p className="mt-8 text-sm text-muted-foreground">{tc('loading')}</p>
              )}

              {!isLoading && standardChartData.length === 0 && (
                <p className="mt-8 text-sm text-muted-foreground">{t('reports.byStandard.empty')}</p>
              )}

              {!isLoading && standardChartData.length > 0 && (
                <>
                  <div className="mt-6 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={standardChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                          {standardChartData.map((_, index) => (
                            <Cell key={index} fill={chartColor(index)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 font-medium">{t('reports.byStandard.columnStandard')}</th>
                          <th className="py-2 font-medium text-right">
                            {t('reports.byStandard.columnStudents')}
                          </th>
                          <th className="py-2 font-medium text-right">{t('reports.columnShare')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.studentsByStandard.map((row) => (
                          <tr key={row.standardId} className="border-b last:border-b-0">
                            <td className="py-2">
                              <Link
                                to={`/students?standardId=${row.standardId}&status=Active`}
                                className="font-medium text-primary hover:underline"
                              >
                                {row.label}
                              </Link>
                            </td>
                            <td className="py-2 text-right tabular-nums">{row.count}</td>
                            <td className="py-2 text-right tabular-nums text-muted-foreground">
                              {data.activeStudents > 0
                                ? `${Math.round((row.count / data.activeStudents) * 100)}%`
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="size-5 text-violet-600" />
                    <h2 className="text-lg font-semibold">{t('reports.bySocialCategory.title')}</h2>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('reports.bySocialCategory.description')}
                  </p>
                </div>
              </div>

              {isLoading && (
                <p className="mt-8 text-sm text-muted-foreground">{tc('loading')}</p>
              )}

              {!isLoading && socialChartData.length === 0 && (
                <p className="mt-8 text-sm text-muted-foreground">
                  {t('reports.bySocialCategory.empty')}
                </p>
              )}

              {!isLoading && socialChartData.length > 0 && (
                <>
                  <div className="mt-4 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={socialChartData}
                          dataKey="count"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={56}
                          outerRadius={96}
                          paddingAngle={2}
                        >
                          {socialChartData.map((entry, index) => (
                            <Cell key={entry.socialCategoryId} fill={entry.fill ?? chartColor(index)} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value) => (
                            <span className="text-xs text-foreground">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 font-medium">
                            {t('reports.bySocialCategory.columnCategory')}
                          </th>
                          <th className="py-2 font-medium text-right">
                            {t('reports.bySocialCategory.columnStudents')}
                          </th>
                          <th className="py-2 font-medium text-right">{t('reports.columnShare')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.studentsBySocialCategory.map((row, index) => (
                          <tr key={row.socialCategoryId} className="border-b last:border-b-0">
                            <td className="py-2">
                              {row.socialCategoryId > 0 ? (
                                <Link
                                  to={`/students?socialCategoryId=${row.socialCategoryId}&status=Active`}
                                  className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                                >
                                  <span
                                    className="size-2.5 rounded-full"
                                    style={{ backgroundColor: chartColor(index) }}
                                  />
                                  {row.label}
                                </Link>
                              ) : (
                                <span className="inline-flex items-center gap-2 text-muted-foreground">
                                  <span
                                    className="size-2.5 rounded-full"
                                    style={{ backgroundColor: chartColor(index) }}
                                  />
                                  {row.label}
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-right tabular-nums">{row.count}</td>
                            <td className="py-2 text-right tabular-nums text-muted-foreground">
                              {totalSocial > 0 ? `${Math.round((row.count / totalSocial) * 100)}%` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">{t('reports.byGender.title')}</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t('reports.byGender.description')}</p>

              {!isLoading && genderChartData.length > 0 && (
                <div className="mt-6 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={genderChartData}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={72} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {genderChartData.map((entry, index) => (
                          <Cell key={entry.gender} fill={entry.fill ?? chartColor(index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-5 text-amber-600" />
                <h2 className="text-lg font-semibold">{t('reports.byStatus.title')}</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t('reports.byStatus.description')}</p>

              {!isLoading && statusChartData.length > 0 && (
                <div className="mt-6 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                        {statusChartData.map((entry, index) => (
                          <Cell
                            key={entry.status}
                            fill={entry.fill ?? CHART_COLORS[(index + 3) % CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {!isLoading && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {data?.studentsByStatus.map((row) => (
                    <Link
                      key={row.status}
                      to={`/students?status=${row.status}`}
                      className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                    >
                      {tc(`status.${row.status.toLowerCase()}` as 'status.active')}: {row.count}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
