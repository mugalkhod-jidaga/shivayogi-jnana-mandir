import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { auditActionLabel, auditEntityLabel } from '@/lib/enumLabels';
import i18n from '@/lib/i18n';

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMetadata(metadata: unknown) {
  if (metadata == null) return '—';
  if (typeof metadata === 'string') return metadata;
  try {
    const text = JSON.stringify(metadata);
    return text.length > 80 ? `${text.slice(0, 80)}…` : text;
  } catch {
    return '—';
  }
}

export function AuditLogsPage() {
  const { t } = useTranslation('audit');
  const { t: tc } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const searchParam = searchParams.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(searchParam);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const { data, isLoading, isError } = useAuditLogs({
    page: Number.isFinite(page) && page > 0 ? page : 1,
    search: searchParam,
  });

  const logs = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  const applySearch = () => {
    const next = new URLSearchParams();
    if (searchInput.trim()) next.set('search', searchInput.trim());
    next.set('page', '1');
    setSearchParams(next);
  };

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

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
            placeholder={t('searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <Button type="submit">{tc('actions.search')}</Button>
      </form>

      {isLoading && <p className="text-muted-foreground">{t('loading')}</p>}

      {isError && <p className="text-destructive">{t('error')}</p>}

      {!isLoading && !isError && logs.length === 0 && (
        <p className="text-muted-foreground">{t('noResults')}</p>
      )}

      {!isLoading && !isError && logs.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">{t('columns.timestamp')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.entity')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.action')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.entityId')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.ip')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.metadata')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 whitespace-nowrap">{formatTimestamp(log.createdAt)}</td>
                  <td className="px-4 py-3">{auditEntityLabel(t, log.entityType)}</td>
                  <td className="px-4 py-3">{auditActionLabel(t, log.actionType)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{log.entityId ?? '—'}</td>
                  <td className="px-4 py-3">{log.ipAddress ?? '—'}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                    {formatMetadata(log.metadata)}
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
            {t('pageOf', { page: meta.page, totalPages, total: meta.total })}
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
