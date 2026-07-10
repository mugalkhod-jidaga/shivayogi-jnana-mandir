import { GraduationCap, MapPin, PieChartIcon, TrendingUp, Users } from 'lucide-react';
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
import { ModuleSectionCard } from '@/components/module-ui/ModuleSectionCard';
import { ModuleStatCard } from '@/components/module-ui/ModuleStatCard';
import { PlaceholderPanel } from '@/components/PlaceholderPanel';
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

  const districtChartData =
    data?.studentsByDistrict
      .filter((row) => row.count > 0)
      .slice(0, 10)
      .map((row, index) => ({
        ...row,
        name: row.label,
        fill: chartColor(index),
      })) ?? [];

  const talukChartData =
    data?.studentsByTaluk
      .filter((row) => row.count > 0)
      .slice(0, 10)
      .map((row, index) => ({
        ...row,
        name: row.label,
        fill: chartColor(index + 2),
      })) ?? [];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t('reports.description')}</p>

      {isError && (
        <PlaceholderPanel title={t('reports.errorTitle')} description={t('reports.errorDescription')} />
      )}

      {!isError && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ModuleStatCard
              title={t('reports.kpis.activeStudents')}
              value={isLoading ? '…' : (data?.activeStudents ?? 0)}
              description={t('reports.kpis.totalEnrolled', { count: data?.totalStudents ?? 0 })}
              icon={Users}
              accent="sky"
            />
            <ModuleStatCard
              title={t('reports.kpis.admissionsYear')}
              value={isLoading ? '…' : (data?.admissionsThisAcademicYear ?? 0)}
              description={data?.currentAcademicYear ?? undefined}
              icon={GraduationCap}
              accent="indigo"
            />
            <ModuleStatCard
              title={t('reports.kpis.standards')}
              value={isLoading ? '…' : standardChartData.length}
              description={t('reports.kpis.standardsHelp')}
              icon={GraduationCap}
              accent="emerald"
            />
            <ModuleStatCard
              title={t('reports.kpis.socialCategories')}
              value={isLoading ? '…' : socialChartData.length}
              description={t('reports.kpis.socialCategoriesHelp')}
              icon={PieChartIcon}
              accent="saffron"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <ModuleSectionCard
              title={t('reports.byStandard.title')}
              description={t('reports.byStandard.description')}
              icon={
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-md">
                  <GraduationCap className="size-5" />
                </div>
              }
              headerClassName="from-sky-50/90 to-cyan-50/60 dark:from-sky-950/25 dark:to-cyan-950/20"
            >
              {isLoading && (
                <p className="text-sm text-muted-foreground">{tc('loading')}</p>
              )}

              {!isLoading && standardChartData.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('reports.byStandard.empty')}</p>
              )}

              {!isLoading && standardChartData.length > 0 && (
                <>
                  <div className="h-72">
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
            </ModuleSectionCard>

            <ModuleSectionCard
              title={t('reports.bySocialCategory.title')}
              description={t('reports.bySocialCategory.description')}
              icon={
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
                  <PieChartIcon className="size-5" />
                </div>
              }
              headerClassName="from-indigo-50/90 to-violet-50/60 dark:from-indigo-950/25 dark:to-violet-950/20"
            >
              {isLoading && (
                <p className="text-sm text-muted-foreground">{tc('loading')}</p>
              )}

              {!isLoading && socialChartData.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('reports.bySocialCategory.empty')}
                </p>
              )}

              {!isLoading && socialChartData.length > 0 && (
                <>
                  <div className="h-72">
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
            </ModuleSectionCard>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <ModuleSectionCard
              title={t('reports.byGender.title')}
              description={t('reports.byGender.description')}
              icon={
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                  <Users className="size-5" />
                </div>
              }
              headerClassName="from-emerald-50/90 to-teal-50/60 dark:from-emerald-950/25 dark:to-teal-950/20"
            >
              {!isLoading && genderChartData.length > 0 && (
                <div className="h-56">
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
            </ModuleSectionCard>

            <ModuleSectionCard
              title={t('reports.byStatus.title')}
              description={t('reports.byStatus.description')}
              icon={
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md">
                  <TrendingUp className="size-5" />
                </div>
              }
              headerClassName="from-orange-50/90 to-amber-50/60 dark:from-orange-950/25 dark:to-amber-950/20"
            >
              {!isLoading && statusChartData.length > 0 && (
                <div className="h-56">
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
                      className="rounded-full border border-amber-200/80 bg-amber-50/80 px-3 py-1 text-xs font-medium transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:hover:bg-amber-950/50"
                    >
                      {tc(`status.${row.status.toLowerCase()}` as 'status.active')}: {row.count}
                    </Link>
                  ))}
                </div>
              )}
            </ModuleSectionCard>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-md">
                <MapPin className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{t('reports.byLocation.title')}</h2>
                <p className="text-sm text-muted-foreground">{t('reports.byLocation.description')}</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ModuleSectionCard title={t('reports.byLocation.byDistrict')}>
                {!isLoading && districtChartData.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t('reports.byLocation.empty')}</p>
                )}
                {!isLoading && districtChartData.length > 0 && (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={districtChartData}
                        layout="vertical"
                        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                          {districtChartData.map((entry, index) => (
                            <Cell key={entry.label} fill={entry.fill ?? chartColor(index)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </ModuleSectionCard>

              <ModuleSectionCard title={t('reports.byLocation.byTaluk')}>
                {!isLoading && talukChartData.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t('reports.byLocation.empty')}</p>
                )}
                {!isLoading && talukChartData.length > 0 && (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={talukChartData}
                        layout="vertical"
                        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                          {talukChartData.map((entry, index) => (
                            <Cell key={entry.label} fill={entry.fill ?? chartColor(index + 2)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </ModuleSectionCard>
            </div>

            {!isLoading && (data?.topVillages.length ?? 0) > 0 && (
              <ModuleSectionCard
                title={t('reports.byLocation.topVillages')}
                description={t('reports.byLocation.topVillagesHelp')}
              >
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 font-medium">{t('reports.byLocation.columnPlace')}</th>
                        <th className="py-2 font-medium text-right">
                          {t('reports.bySocialCategory.columnStudents')}
                        </th>
                        <th className="py-2 font-medium text-right">{t('reports.columnShare')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.topVillages.map((row) => (
                        <tr key={row.label} className="border-b last:border-b-0">
                          <td className="py-2">{row.label}</td>
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
              </ModuleSectionCard>
            )}

            {!isLoading && districtChartData.length > 0 && (
              <ModuleSectionCard title={t('reports.byLocation.districtTable')}>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 font-medium">{t('reports.byLocation.columnDistrict')}</th>
                        <th className="py-2 font-medium text-right">
                          {t('reports.bySocialCategory.columnStudents')}
                        </th>
                        <th className="py-2 font-medium text-right">{t('reports.columnShare')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.studentsByDistrict.map((row) => (
                        <tr key={row.label} className="border-b last:border-b-0">
                          <td className="py-2">{row.label}</td>
                          <td className="py-2 text-right tabular-nums">{row.count}</td>
                          <td className="py-2 text-right tabular-nums text-muted-foreground">
                            {(data?.activeStudents ?? 0) > 0
                              ? `${Math.round((row.count / (data?.activeStudents ?? 1)) * 100)}%`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ModuleSectionCard>
            )}
          </section>
        </>
      )}
    </div>
  );
}
