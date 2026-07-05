import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated } from '@/lib/api';
import type {
  CreateHealthVisitInput,
  HealthVisit,
  HealthVisitListFilters,
  HealthVisitSummary,
} from '@/types/health';

export const healthKeys = {
  all: ['health'] as const,
  list: (filters: HealthVisitListFilters) => [...healthKeys.all, 'list', filters] as const,
  recent: (search?: string) => [...healthKeys.all, 'recent', search ?? ''] as const,
  byStudent: (studentId: string, filters: HealthVisitListFilters) =>
    [...healthKeys.all, 'student', studentId, filters] as const,
  summary: (studentId: string) => [...healthKeys.all, 'summary', studentId] as const,
  detail: (id: string) => [...healthKeys.all, 'detail', id] as const,
};

function buildListQuery(filters: HealthVisitListFilters) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 20),
  });
  if (filters.search) params.set('search', filters.search);
  if (filters.studentId) params.set('studentId', filters.studentId);
  if (filters.severityId) params.set('severityId', String(filters.severityId));
  return params.toString();
}

export function useHealthVisitsList(filters: HealthVisitListFilters = {}) {
  const normalized = { page: 1, limit: 20, ...filters };
  return useQuery({
    queryKey: healthKeys.list(normalized),
    queryFn: () => apiFetchPaginated<HealthVisit>(`/health/visits?${buildListQuery(normalized)}`),
    placeholderData: (prev) => prev,
  });
}

export function useRecentHealthVisits(search?: string) {
  const params = new URLSearchParams({ limit: '50' });
  if (search) params.set('search', search);
  return useQuery({
    queryKey: healthKeys.recent(search),
    queryFn: () => apiFetch<HealthVisit[]>(`/health/visits/recent?${params.toString()}`),
  });
}

export function useStudentHealthVisits(studentId: string | undefined, filters: HealthVisitListFilters = {}) {
  const normalized = { page: 1, limit: 20, ...filters };
  return useQuery({
    queryKey: healthKeys.byStudent(studentId ?? '', normalized),
    queryFn: () =>
      apiFetchPaginated<HealthVisit>(
        `/health/students/${studentId}/visits?${buildListQuery(normalized)}`,
      ),
    enabled: Boolean(studentId),
  });
}

export function useStudentHealthSummary(studentId: string | undefined) {
  return useQuery({
    queryKey: healthKeys.summary(studentId ?? ''),
    queryFn: () => apiFetch<HealthVisitSummary>(`/health/students/${studentId}/visit-summary`),
    enabled: Boolean(studentId),
  });
}

export function useCreateHealthVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHealthVisitInput) =>
      apiFetch<HealthVisit>('/health/visits', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: healthKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
