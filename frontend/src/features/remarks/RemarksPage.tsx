import { Download, MessageSquare, MessageSquarePlus, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MODULE_GRADIENTS } from '@/components/module-ui/moduleGradients';
import { ModuleHeroBanner } from '@/components/module-ui/ModuleHeroBanner';
import { ModuleStatCard } from '@/components/module-ui/ModuleStatCard';
import { RequirePermission } from '@/components/RequirePermission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { usePhase2Lookups } from '@/hooks/usePhase2Lookups';
import { useRemarkStats, useRemarksList } from '@/hooks/useRemarks';
import { pdfExports } from '@/lib/pdfDownload';

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function RemarksPage() {
  const { t } = useTranslation('remarks');
  const { t: tc } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeId, setTypeId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [days, setDays] = useState('7');
  const [pdfLoading, setPdfLoading] = useState(false);

  const { remarkTypes, remarkCategories } = usePhase2Lookups();
  const { data, isLoading } = useRemarksList({
    page,
    search: search || undefined,
    typeId: typeId ? Number(typeId) : undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    days: days ? Number(days) : undefined,
  });
  const { data: stats } = useRemarkStats(Number(days) || 7);

  const remarks = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      await pdfExports.remarks({
        search: search || undefined,
        typeId: typeId || undefined,
        categoryId: categoryId || undefined,
        days: days || undefined,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHeroBanner
        title={t('hero.title')}
        description={t('hero.description')}
        tagline={t('hero.tagline')}
        icon={MessageSquare}
        gradientClassName={MODULE_GRADIENTS.remarks}
      >
        <RequirePermission permission="exports:pdf">
          <Button
            type="button"
            variant="secondary"
            className="bg-white/20 text-white hover:bg-white/30"
            disabled={pdfLoading}
            onClick={() => void handlePdf()}
          >
            <Download className="size-4" />
            {t('actions.downloadPdf')}
          </Button>
        </RequirePermission>
      </ModuleHeroBanner>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <ModuleStatCard title={t('stats.total')} value={stats.total} icon={MessageSquare} accent="saffron" />
          <ModuleStatCard title={t('stats.positive')} value={stats.positive} icon={ThumbsUp} accent="emerald" />
          <ModuleStatCard title={t('stats.negative')} value={stats.negative} icon={ThumbsDown} accent="rose" />
          <ModuleStatCard
            title={t('stats.observation')}
            value={stats.observation}
            icon={MessageSquarePlus}
            accent="indigo"
          />
        </div>
      )}

      <form
        className="grid gap-3 rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50/40 to-rose-50/30 p-4 dark:border-amber-900/30 dark:from-amber-950/20 dark:to-rose-950/15 md:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
        }}
      >
        <Input
          placeholder={tc('actions.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
          <option value="">{t('filters.allTypes')}</option>
          {remarkTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.value}
            </option>
          ))}
        </Select>
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">{t('filters.allCategories')}</option>
          {remarkCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.value}
            </option>
          ))}
        </Select>
        <Select value={days} onChange={(e) => setDays(e.target.value)}>
          <option value="7">{t('filters.last7Days')}</option>
          <option value="30">{t('filters.last30Days')}</option>
          <option value="90">{t('filters.last90Days')}</option>
        </Select>
        <Button type="submit">{tc('actions.apply')}</Button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3">{t('columns.date')}</th>
              <th className="px-4 py-3">{t('columns.student')}</th>
              <th className="px-4 py-3">{t('columns.type')}</th>
              <th className="px-4 py-3">{t('columns.category')}</th>
              <th className="px-4 py-3">{t('columns.title')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {tc('loading')}
                </td>
              </tr>
            )}
            {!isLoading && remarks.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {t('empty')}
                </td>
              </tr>
            )}
            {remarks.map((remark) => (
              <tr key={remark.id} className="border-t">
                <td className="px-4 py-3">{new Date(remark.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">
                  <Link className="text-primary hover:underline" to={`/students/${remark.student.id}`}>
                    {formatName(remark.student.firstName, remark.student.lastName)}
                  </Link>
                  <div className="text-xs text-muted-foreground">{remark.student.admissionNumber}</div>
                </td>
                <td className="px-4 py-3">{remark.remarkType.value}</td>
                <td className="px-4 py-3">{remark.category.value}</td>
                <td className="px-4 py-3">{remark.title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.total > meta.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('pagination', { page: meta.page, totalPages, total: meta.total })}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              {tc('actions.previous')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              {tc('actions.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RemarkAddHint() {
  const { t } = useTranslation('remarks');
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <MessageSquarePlus className="size-4" />
      {t('addFromStudent')}
    </p>
  );
}
