import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { HealthReportSummary } from '@/types/healthReports';
import { healthKeys } from '@/hooks/useHealth';

export function useHealthReports() {
  return useQuery({
    queryKey: [...healthKeys.all, 'reports'] as const,
    queryFn: () => apiFetch<HealthReportSummary>('/health/reports'),
    staleTime: 60_000,
  });
}
