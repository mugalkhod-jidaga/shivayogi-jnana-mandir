import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { HealthReportSummary } from '@/types/healthReports';
import { healthKeys } from '@/hooks/useHealth';

export function useHealthReports(days?: number) {
  return useQuery({
    queryKey: [...healthKeys.all, 'reports', days ?? 'all'] as const,
    queryFn: () => {
      const params = new URLSearchParams();
      if (days != null) params.set('days', String(days));
      const qs = params.toString();
      return apiFetch<HealthReportSummary>(`/health/reports${qs ? `?${qs}` : ''}`);
    },
    staleTime: 60_000,
  });
}
