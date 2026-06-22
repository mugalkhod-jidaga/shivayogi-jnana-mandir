import { useQuery } from '@tanstack/react-query';
import { apiFetchPaginated } from '@/lib/api';
import type { AuditLogEntry } from '@/types/dashboard';

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  list: (page: number, limit: number, search: string) =>
    ['audit-logs', 'list', { page, limit, search }] as const,
};

type UseAuditLogsParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export function useAuditLogs({ page = 1, limit = 20, search = '' }: UseAuditLogsParams = {}) {
  const queryString = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
  }).toString();

  return useQuery({
    queryKey: auditLogKeys.list(page, limit, search),
    queryFn: () => apiFetchPaginated<AuditLogEntry>(`/audit-logs?${queryString}`),
    placeholderData: (previous) => previous,
  });
}
