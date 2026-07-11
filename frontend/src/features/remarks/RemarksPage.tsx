import { Check, Download, MessageSquarePlus, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { RequirePermission } from '@/components/RequirePermission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { AddRemarkDialog } from '@/features/remarks/components/AddRemarkDialog';
import { EditRemarkDialog } from '@/features/remarks/components/EditRemarkDialog';
import { useMe } from '@/hooks/useMe';
import { usePermissions } from '@/hooks/usePermissions';
import { usePhase2Lookups } from '@/hooks/usePhase2Lookups';
import { useRemarksList, useUpdateRemark } from '@/hooks/useRemarks';
import { pdfExports } from '@/lib/pdfDownload';
import type { RemarkResolvedStatus, RemarkSummary } from '@/types/remark';

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

function canEditRemark(
  remark: RemarkSummary,
  profileId: string | undefined,
  canManage: boolean,
  canEditPerm: boolean,
) {
  if (canManage) return true;
  if (!canEditPerm) return false;
  if (!profileId || remark.createdBy.id !== profileId) return false;
  const created = new Date(remark.createdAt).getTime();
  return Date.now() - created <= 24 * 60 * 60 * 1000;
}

export function RemarksPage() {
  const { t } = useTranslation('remarks');
  const { t: tc } = useTranslation();
  const location = useLocation();
  const { data: me } = useMe();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('remarks:manage');
  const canEditPerm = hasPermission('remarks:edit');
  const canResolve = canEditPerm || canManage;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeId, setTypeId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [days, setDays] = useState('');
  const [resolvedStatus, setResolvedStatus] = useState<RemarkResolvedStatus>('all');
  const [applied, setApplied] = useState({
    search: '',
    typeId: '',
    categoryId: '',
    days: '',
    resolvedStatus: 'all' as RemarkResolvedStatus,
  });
  const [pdfLoading, setPdfLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<RemarkSummary | null>(null);

  const { remarkTypes, remarkCategories } = usePhase2Lookups();
  const updateRemark = useUpdateRemark();

  const { data, isLoading } = useRemarksList({
    page,
    search: applied.search || undefined,
    typeId: applied.typeId ? Number(applied.typeId) : undefined,
    categoryId: applied.categoryId ? Number(applied.categoryId) : undefined,
    days: applied.days ? Number(applied.days) : undefined,
    resolvedStatus: applied.resolvedStatus,
  });

  const remarks = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;
  const fromPath = `/remarks${location.search}`;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied({ search, typeId, categoryId, days, resolvedStatus });
    setPage(1);
  };

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      await pdfExports.remarks({
        search: applied.search || undefined,
        typeId: applied.typeId || undefined,
        categoryId: applied.categoryId || undefined,
        days: applied.days || undefined,
        resolvedStatus: applied.resolvedStatus !== 'all' ? applied.resolvedStatus : undefined,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleResolve = async (remark: RemarkSummary) => {
    await updateRemark.mutateAsync({
      id: remark.id,
      input: { resolved: !remark.resolvedAt },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <RequirePermission permission="exports:pdf">
          <Button
            type="button"
            variant="outline"
            disabled={pdfLoading}
            onClick={() => void handlePdf()}
          >
            <Download className="size-4" />
            {t('actions.downloadPdf')}
          </Button>
        </RequirePermission>
        <RequirePermission permission="remarks:create">
          <Button type="button" onClick={() => setAddOpen(true)}>
            <MessageSquarePlus className="size-4" />
            {t('actions.addRemark')}
          </Button>
        </RequirePermission>
      </div>

      <form
        className="grid gap-3 rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50/40 to-rose-50/30 p-4 dark:border-amber-900/30 dark:from-amber-950/20 dark:to-rose-950/15 md:grid-cols-3 lg:grid-cols-6"
        onSubmit={handleApply}
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
          <option value="">{t('filters.allDays')}</option>
          <option value="7">{t('filters.last7Days')}</option>
          <option value="30">{t('filters.last30Days')}</option>
          <option value="90">{t('filters.last90Days')}</option>
        </Select>
        <Select
          value={resolvedStatus}
          onChange={(e) => setResolvedStatus(e.target.value as RemarkResolvedStatus)}
        >
          <option value="all">{t('filters.allResolved')}</option>
          <option value="open">{t('filters.open')}</option>
          <option value="resolved">{t('filters.resolved')}</option>
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
              <th className="px-4 py-3">{t('columns.status')}</th>
              <th className="px-4 py-3">{t('columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  {tc('loading')}
                </td>
              </tr>
            )}
            {!isLoading && remarks.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  {t('empty')}
                </td>
              </tr>
            )}
            {remarks.map((remark) => {
              const showEdit = canEditRemark(remark, me?.id, canManage, canEditPerm);
              return (
                <tr key={remark.id} className="border-t">
                  <td className="px-4 py-3">
                    {new Date(remark.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      className="text-primary hover:underline"
                      to={`/students/${remark.student.id}`}
                      state={{ from: fromPath }}
                    >
                      {formatName(remark.student.firstName, remark.student.lastName)}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {remark.student.admissionNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3">{remark.remarkType.value}</td>
                  <td className="px-4 py-3">{remark.category.value}</td>
                  <td className="px-4 py-3">{remark.title}</td>
                  <td className="px-4 py-3">
                    {remark.resolvedAt ? (
                      <span className="text-green-700">{t('status.resolved')}</span>
                    ) : (
                      <span className="text-muted-foreground">{t('status.open')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {showEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(remark)}
                        >
                          <Pencil className="size-4" />
                          {t('actions.edit')}
                        </Button>
                      )}
                      {canResolve && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleResolve(remark)}
                          disabled={updateRemark.isPending}
                        >
                          <Check className="size-4" />
                          {remark.resolvedAt ? t('actions.reopen') : t('actions.resolve')}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
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

      <AddRemarkDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditRemarkDialog
        open={Boolean(editing)}
        remark={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </div>
  );
}
