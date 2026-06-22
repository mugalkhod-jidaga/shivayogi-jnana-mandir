import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuditLogs } from '@/hooks/useAuditLogs';

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
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
      <PageHeader
        title="Audit Logs"
        description="Search and review system activity across the tenant."
      />

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
            placeholder="Search by entity or action type"
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {isLoading && <p className="text-muted-foreground">Loading audit logs…</p>}

      {isError && (
        <p className="text-destructive">Could not load audit logs. Try again later.</p>
      )}

      {!isLoading && !isError && logs.length === 0 && (
        <p className="text-muted-foreground">No audit log entries match this search.</p>
      )}

      {!isLoading && !isError && logs.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity ID</th>
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 whitespace-nowrap">{formatTimestamp(log.createdAt)}</td>
                  <td className="px-4 py-3">{log.entityType}</td>
                  <td className="px-4 py-3">{log.actionType}</td>
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
            Page {meta.page} of {totalPages} · {meta.total} total
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => goToPage(meta.page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page >= totalPages}
              onClick={() => goToPage(meta.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
