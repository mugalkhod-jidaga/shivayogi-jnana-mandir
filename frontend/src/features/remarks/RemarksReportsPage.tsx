import { MessageSquare, MessageSquarePlus, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ModuleSectionCard } from '@/components/module-ui/ModuleSectionCard';
import { ModuleStatCard } from '@/components/module-ui/ModuleStatCard';
import { Select } from '@/components/ui/select';
import { useRemarkStats } from '@/hooks/useRemarks';

const TYPE_COLORS = {
  positive: '#059669',
  negative: '#dc2626',
  observation: '#6b7280',
};

export function RemarksReportsPage() {
  const { t } = useTranslation('remarks');
  const [days, setDays] = useState('');
  const daysNum = days ? Number(days) : undefined;
  const { data: stats, isLoading } = useRemarkStats(daysNum);

  const chartData = [
    {
      key: 'positive',
      name: t('stats.positive'),
      count: stats?.positive ?? 0,
      fill: TYPE_COLORS.positive,
    },
    {
      key: 'negative',
      name: t('stats.negative'),
      count: stats?.negative ?? 0,
      fill: TYPE_COLORS.negative,
    },
    {
      key: 'observation',
      name: t('stats.observation'),
      count: stats?.observation ?? 0,
      fill: TYPE_COLORS.observation,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t('reports.description')}</p>
        <Select value={days} onChange={(e) => setDays(e.target.value)} className="w-44">
          <option value="">{t('filters.allDays')}</option>
          <option value="7">{t('filters.last7Days')}</option>
          <option value="30">{t('filters.last30Days')}</option>
          <option value="90">{t('filters.last90Days')}</option>
        </Select>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ModuleStatCard
          title={t('stats.total')}
          value={isLoading ? '…' : (stats?.total ?? 0)}
          icon={MessageSquare}
          accent="saffron"
        />
        <ModuleStatCard
          title={t('stats.positive')}
          value={isLoading ? '…' : (stats?.positive ?? 0)}
          icon={ThumbsUp}
          accent="emerald"
        />
        <ModuleStatCard
          title={t('stats.negative')}
          value={isLoading ? '…' : (stats?.negative ?? 0)}
          icon={ThumbsDown}
          accent="rose"
        />
        <ModuleStatCard
          title={t('stats.observation')}
          value={isLoading ? '…' : (stats?.observation ?? 0)}
          icon={MessageSquarePlus}
          accent="indigo"
        />
      </section>

      <ModuleSectionCard
        title={t('reports.byType.title')}
        description={t('reports.byType.description')}
        icon={
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
            <MessageSquare className="size-5" />
          </div>
        }
        headerClassName="from-amber-50/90 to-orange-50/60 dark:from-amber-950/25 dark:to-orange-950/20"
      >
        {!isLoading && (stats?.total ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">{t('reports.empty')}</p>
        )}
        {!isLoading && (stats?.total ?? 0) > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={28} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0]?.payload as { name: string; count: number };
                    return (
                      <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-md">
                        <p className="font-medium">{row.name}</p>
                        <p className="tabular-nums text-muted-foreground">{row.count}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ModuleSectionCard>
    </div>
  );
}
