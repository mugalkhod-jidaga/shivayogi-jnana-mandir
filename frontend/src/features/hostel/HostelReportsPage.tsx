import { useMemo, useState } from 'react';
import { BedDouble, PieChartIcon, TrendingUp, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import {
  useHostelAttendanceTrend,
  useHostelBlocks,
  useHostelDailyReport,
  useHostelOccupancyReport,
} from '@/hooks/useHostel';
import { formatDobDisplay } from '@/lib/date';

const ATTENDANCE_COLORS = {
  present: '#16a34a',
  absent: '#dc2626',
  notMarked: '#94a3b8',
} as const;

const OCCUPANCY_COLORS = {
  occupied: '#2563eb',
  vacant: '#cbd5e1',
} as const;

function ChartTooltip({
  active,
  payload,
  label,
  valueLabel,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: { label?: string; name?: string; date?: string };
  }>;
  label?: string;
  valueLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  const dateLabel =
    payload[0]?.payload?.date != null ? formatDobDisplay(payload[0].payload.date) : label;
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-md">
      {dateLabel && <p className="font-medium">{dateLabel}</p>}
      {payload.map((entry) => (
        <p key={entry.name} className="tabular-nums text-muted-foreground">
          {entry.name}: {entry.value ?? 0}
          {valueLabel ? ` ${valueLabel}` : ''}
        </p>
      ))}
    </div>
  );
}

function DonutCenter({ label, value }: { label: string; value: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <span className="text-3xl font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function HostelReportsPage() {
  const { t } = useTranslation('hostel');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [blockId, setBlockId] = useState('');
  const [appliedDate, setAppliedDate] = useState(date);
  const [appliedBlockId, setAppliedBlockId] = useState('');

  const blockFilter = appliedBlockId ? Number(appliedBlockId) : undefined;

  const { data: blocksData } = useHostelBlocks();
  const blocks = blocksData?.data ?? [];

  const { data: daily, isLoading: dailyLoading } = useHostelDailyReport(appliedDate, blockFilter);
  const { data: occupancy, isLoading: occLoading } = useHostelOccupancyReport(blockFilter);
  const { data: trend, isLoading: trendLoading } = useHostelAttendanceTrend(appliedDate, blockFilter);

  const isLoading = dailyLoading || occLoading || trendLoading;

  const occupancyRate = useMemo(() => {
    if (!occupancy?.summary.totalBeds) return 0;
    return Math.round((occupancy.summary.occupiedBeds / occupancy.summary.totalBeds) * 100);
  }, [occupancy]);

  const occupancyPieData = useMemo(
    () =>
      occupancy
        ? [
            {
              name: t('reports.occupied'),
              value: occupancy.summary.occupiedBeds,
              fill: OCCUPANCY_COLORS.occupied,
            },
            {
              name: t('reports.vacant'),
              value: occupancy.summary.vacantBeds,
              fill: OCCUPANCY_COLORS.vacant,
            },
          ].filter((row) => row.value > 0)
        : [],
    [occupancy, t],
  );

  const attendancePieData = useMemo(
    () =>
      daily?.hasSession
        ? [
            {
              name: t('reports.present'),
              value: daily.totals.present,
              fill: ATTENDANCE_COLORS.present,
            },
            {
              name: t('reports.absent'),
              value: daily.totals.absent,
              fill: ATTENDANCE_COLORS.absent,
            },
            {
              name: t('reports.notMarked'),
              value: daily.totals.notMarked,
              fill: ATTENDANCE_COLORS.notMarked,
            },
          ].filter((row) => row.value > 0)
        : [],
    [daily, t],
  );

  const blockBarData = useMemo(
    () =>
      (occupancy?.blocks ?? []).map((b) => ({
        name: b.blockName,
        occupied: b.occupiedBeds,
        vacant: b.vacantBeds,
        rate: b.totalBeds ? Math.round((b.occupiedBeds / b.totalBeds) * 100) : 0,
      })),
    [occupancy],
  );

  const trendChartData = useMemo(
    () =>
      (trend?.points ?? []).map((row) => ({
        ...row,
        shortDate: formatDobDisplay(row.date).slice(0, 5),
      })),
    [trend],
  );

  const attendanceRate = useMemo(() => {
    if (!daily?.hasSession || !daily.totals.roster) return null;
    return Math.round((daily.totals.present / daily.totals.roster) * 100);
  }, [daily]);

  return (
    <div className="space-y-8">
      <form
        className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedDate(date);
          setAppliedBlockId(blockId);
        }}
      >
        <div>
          <Label>{t('reports.date')}</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>{t('reports.block')}</Label>
          <select
            className="flex h-10 min-w-[160px] rounded-md border bg-background px-3 text-sm"
            value={blockId}
            onChange={(e) => setBlockId(e.target.value)}
          >
            <option value="">{t('attendance.allBlocks')}</option>
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">{t('reports.apply')}</Button>
      </form>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title={t('reports.kpis.occupancyRate')}
          value={isLoading ? '…' : `${occupancyRate}%`}
          description={t('reports.kpis.occupancyRateHelp', {
            occupied: occupancy?.summary.occupiedBeds ?? 0,
            total: occupancy?.summary.totalBeds ?? 0,
          })}
          className="border-l-4 border-l-blue-500"
        />
        <KpiCard
          title={t('reports.kpis.vacantBeds')}
          value={isLoading ? '…' : (occupancy?.summary.vacantBeds ?? 0)}
          className="border-l-4 border-l-slate-400"
        />
        <KpiCard
          title={t('reports.kpis.presentToday')}
          value={isLoading ? '…' : daily?.hasSession ? daily.totals.present : '—'}
          description={
            daily?.hasSession && attendanceRate !== null
              ? t('reports.kpis.presentTodayHelp', { rate: attendanceRate })
              : t('reports.noSession')
          }
          className="border-l-4 border-l-emerald-500"
        />
        <KpiCard
          title={t('reports.kpis.absentToday')}
          value={isLoading ? '…' : daily?.hasSession ? daily.totals.absent : '—'}
          description={
            daily?.hasSession
              ? t('reports.kpis.rosterHelp', { count: daily.totals.roster })
              : undefined
          }
          className="border-l-4 border-l-red-500"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <BedDouble className="size-5 text-blue-600" />
            <h2 className="text-lg font-semibold">{t('reports.charts.occupancySplit')}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t('reports.charts.occupancySplitHelp')}</p>
          {!isLoading && occupancyPieData.length === 0 && (
            <p className="mt-6 text-sm text-muted-foreground">{t('reports.charts.noBeds')}</p>
          )}
          {!isLoading && occupancyPieData.length > 0 && (
            <div className="relative mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {occupancyPieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip valueLabel={t('reports.charts.beds')} />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <DonutCenter label={t('reports.kpis.occupancyRate')} value={`${occupancyRate}%`} />
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <PieChartIcon className="size-5 text-emerald-600" />
            <h2 className="text-lg font-semibold">{t('reports.charts.attendanceSplit')}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('reports.charts.attendanceSplitHelp', { date: formatDobDisplay(appliedDate) })}
          </p>
          {!isLoading && !daily?.hasSession && (
            <p className="mt-6 text-sm text-muted-foreground">{t('reports.noSession')}</p>
          )}
          {!isLoading && daily?.hasSession && attendancePieData.length > 0 && (
            <div className="relative mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendancePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {attendancePieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip valueLabel={t('reports.charts.students')} />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              {attendanceRate !== null && (
                <DonutCenter label={t('reports.present')} value={`${attendanceRate}%`} />
              )}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-violet-600" />
          <h2 className="text-lg font-semibold">{t('reports.charts.blockOccupancy')}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t('reports.charts.blockOccupancyHelp')}</p>
        {!isLoading && blockBarData.length === 0 && (
          <p className="mt-6 text-sm text-muted-foreground">{t('reports.charts.noBlocks')}</p>
        )}
        {!isLoading && blockBarData.length > 0 && (
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={blockBarData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip valueLabel={t('reports.charts.beds')} />} />
                <Legend />
                <Bar dataKey="occupied" name={t('reports.occupied')} stackId="beds" fill={OCCUPANCY_COLORS.occupied} />
                <Bar dataKey="vacant" name={t('reports.vacant')} stackId="beds" fill={OCCUPANCY_COLORS.vacant} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-5 text-blue-600" />
          <h2 className="text-lg font-semibold">{t('reports.charts.trendTitle')}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t('reports.charts.trendHelp')}</p>
        {!isLoading && trendChartData.length > 0 && (
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="shortDate" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip valueLabel={t('reports.charts.students')} />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="present"
                  name={t('reports.present')}
                  stroke={ATTENDANCE_COLORS.present}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="absent"
                  name={t('reports.absent')}
                  stroke={ATTENDANCE_COLORS.absent}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {occupancy && occupancy.blocks.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-medium">{t('reports.details.occupancyTable')}</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2">{t('reports.block')}</th>
                  <th className="px-3 py-2">{t('reports.totalBeds')}</th>
                  <th className="px-3 py-2">{t('reports.occupied')}</th>
                  <th className="px-3 py-2">{t('reports.vacant')}</th>
                  <th className="px-3 py-2">{t('reports.kpis.occupancyRate')}</th>
                </tr>
              </thead>
              <tbody>
                {occupancy.blocks.map((b) => (
                  <tr key={b.blockId} className="border-t">
                    <td className="px-3 py-2">{b.blockName}</td>
                    <td className="px-3 py-2">{b.totalBeds}</td>
                    <td className="px-3 py-2">{b.occupiedBeds}</td>
                    <td className="px-3 py-2">{b.vacantBeds}</td>
                    <td className="px-3 py-2">
                      {b.totalBeds ? Math.round((b.occupiedBeds / b.totalBeds) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {daily?.hasSession && (
        <section className="space-y-4">
          <h2 className="font-medium">{t('reports.details.dailyLists')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('reports.dailySummary', {
              present: daily.totals.present,
              absent: daily.totals.absent,
              notMarked: daily.totals.notMarked,
              roster: daily.totals.roster,
            })}
          </p>
          {daily.present.length > 0 && (
            <ReportTable title={t('reports.present')} rows={daily.present} t={t} variant="present" />
          )}
          {daily.absent.length > 0 && (
            <ReportTable title={t('reports.absent')} rows={daily.absent} t={t} variant="absent" />
          )}
          {daily.notMarked.length > 0 && (
            <ReportTable title={t('reports.notMarked')} rows={daily.notMarked} t={t} variant="neutral" />
          )}
        </section>
      )}
    </div>
  );
}

function ReportTable({
  title,
  rows,
  t,
  variant,
}: {
  title: string;
  rows: Array<{
    admissionNumber: string;
    firstName: string;
    lastName: string | null;
    blockName: string;
    roomNumber: string;
    bedSlot: number | null;
    status: string | null;
  }>;
  t: (key: string, opts?: Record<string, unknown>) => string;
  variant: 'present' | 'absent' | 'neutral';
}) {
  const borderClass =
    variant === 'present'
      ? 'border-l-4 border-l-emerald-500'
      : variant === 'absent'
        ? 'border-l-4 border-l-red-500'
        : 'border-l-4 border-l-slate-400';

  return (
    <div className={`space-y-2 rounded-lg border bg-card p-4 ${borderClass}`}>
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2">{t('attendance.columns.student')}</th>
              <th className="px-3 py-2">{t('allocations.columns.bed')}</th>
              <th className="px-3 py-2">{t('attendance.columns.room')}</th>
              <th className="px-3 py-2">{t('attendance.columns.status')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.admissionNumber} className="border-t">
                <td className="px-3 py-2">
                  {formatName(row.firstName, row.lastName)}
                  <div className="text-xs text-muted-foreground">{row.admissionNumber}</div>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{row.admissionNumber}</td>
                <td className="px-3 py-2">
                  {row.blockName} / {row.roomNumber}
                </td>
                <td className="px-3 py-2">{row.status ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
