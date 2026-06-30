import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentActions } from '@/features/documents/components/DocumentActions';
import { DocumentStatusBadge } from '@/features/documents/components/DocumentStatusBadge';
import { formatDate, formatFileSize } from '@/features/documents/documentFormatters';
import { useDocumentQueue } from '@/hooks/useDocuments';

function formatStudentName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function DocumentQueuePage() {
  const { t } = useTranslation('documents');
  const { t: tc } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const searchParam = searchParams.get('search') ?? '';
  const statusParam = searchParams.get('status') ?? 'Pending Review';
  const [searchInput, setSearchInput] = useState(searchParam);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const { data, isLoading, isError } = useDocumentQueue({
    page: Number.isFinite(page) && page > 0 ? page : 1,
    search: searchParam || undefined,
    status: statusParam || undefined,
  });

  const documents = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  const applySearch = () => {
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) next.set('search', searchInput.trim());
    else next.delete('search');
    next.set('page', '1');
    setSearchParams(next);
  };

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  };

  const setStatusFilter = (status: string) => {
    const next = new URLSearchParams(searchParams);
    if (status) next.set('status', status);
    else next.delete('status');
    next.set('page', '1');
    setSearchParams(next);
  };

  const statusFilters = useMemo(
    () => [
      { value: 'Pending Review', label: t('queue.filters.pendingReview') },
      { value: 'Verified', label: t('queue.filters.verified') },
      { value: 'Rejected', label: t('queue.filters.rejected') },
      { value: 'Renewal Needed', label: t('queue.filters.renewalNeeded') },
      { value: '', label: t('queue.filters.all') },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t('queue.title')} description={t('queue.description')} />

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <Button
            key={filter.label}
            type="button"
            size="sm"
            variant={statusParam === filter.value ? 'default' : 'outline'}
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          applySearch();
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('queue.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <Button type="submit">{tc('actions.search')}</Button>
      </form>

      {isLoading && <p className="text-muted-foreground">{t('queue.loading')}</p>}

      {isError && <p className="text-destructive">{t('queue.error')}</p>}

      {!isLoading && !isError && documents.length === 0 && (
        <p className="text-muted-foreground">{t('queue.noResults')}</p>
      )}

      {!isLoading && !isError && documents.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">{t('queue.columns.student')}</th>
                <th className="px-4 py-3 font-medium">{t('queue.columns.type')}</th>
                <th className="px-4 py-3 font-medium">{t('queue.columns.file')}</th>
                <th className="px-4 py-3 font-medium">{t('queue.columns.status')}</th>
                <th className="px-4 py-3 font-medium">{t('queue.columns.uploaded')}</th>
                <th className="px-4 py-3 font-medium">{t('queue.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <Link
                      to={`/students/${document.student.id}?tab=documents`}
                      className="font-medium text-primary hover:underline"
                    >
                      {formatStudentName(document.student.firstName, document.student.lastName)}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      #{document.student.admissionNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3">{document.documentType?.value ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div>{document.originalFilename ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(document.fileSize)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <DocumentStatusBadge status={document.status} />
                  </td>
                  <td className="px-4 py-3">{formatDate(document.uploadedAt)}</td>
                  <td className="px-4 py-3">
                    <DocumentActions document={document} compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.total > meta.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('queue.pageOf', { page: meta.page, totalPages, total: meta.total })}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => goToPage(meta.page - 1)}
            >
              {tc('actions.previous')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page >= totalPages}
              onClick={() => goToPage(meta.page + 1)}
            >
              {tc('actions.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
