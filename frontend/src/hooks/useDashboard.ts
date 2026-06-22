import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { ComplianceReportRow, DashboardSummary } from '@/types/dashboard';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: ['dashboard', 'summary'] as const,
  compliance: ['dashboard', 'compliance'] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: () => apiFetch<DashboardSummary>('/dashboard/summary'),
    staleTime: 60 * 1000,
  });
}

export function useComplianceReport() {
  return useQuery({
    queryKey: dashboardKeys.compliance,
    queryFn: () => apiFetch<ComplianceReportRow[]>('/dashboard/compliance-report'),
    staleTime: 60 * 1000,
  });
}
