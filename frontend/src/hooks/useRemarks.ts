import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated } from '@/lib/api';
import type {
  CreateRemarkInput,
  RemarkListFilters,
  RemarkStats,
  RemarkSummary,
} from '@/types/remark';

export const remarkKeys = {
  all: ['remarks'] as const,
  list: (filters: RemarkListFilters) => [...remarkKeys.all, 'list', filters] as const,
  stats: (days: number) => [...remarkKeys.all, 'stats', days] as const,
  byStudent: (studentId: string, filters: RemarkListFilters) =>
    [...remarkKeys.all, 'student', studentId, filters] as const,
};

function buildQuery(filters: RemarkListFilters) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 20),
  });
  if (filters.search) params.set('search', filters.search);
  if (filters.typeId) params.set('typeId', String(filters.typeId));
  if (filters.categoryId) params.set('categoryId', String(filters.categoryId));
  if (filters.days) params.set('days', String(filters.days));
  if (filters.studentId) params.set('studentId', filters.studentId);
  return params.toString();
}

export function useRemarksList(filters: RemarkListFilters = {}) {
  const normalized = { page: 1, limit: 20, ...filters };
  return useQuery({
    queryKey: remarkKeys.list(normalized),
    queryFn: () => apiFetchPaginated<RemarkSummary>(`/remarks?${buildQuery(normalized)}`),
    placeholderData: (prev) => prev,
  });
}

export function useStudentRemarks(studentId: string | undefined, filters: RemarkListFilters = {}) {
  const normalized = { page: 1, limit: 20, ...filters };
  return useQuery({
    queryKey: remarkKeys.byStudent(studentId ?? '', normalized),
    queryFn: () =>
      apiFetchPaginated<RemarkSummary>(
        `/students/${studentId}/remarks?${buildQuery(normalized)}`,
      ),
    enabled: Boolean(studentId),
  });
}

export function useRemarkStats(days = 7) {
  return useQuery({
    queryKey: remarkKeys.stats(days),
    queryFn: () => apiFetch<RemarkStats>(`/remarks/stats?days=${days}`),
  });
}

export function useCreateRemark(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRemarkInput) =>
      apiFetch<RemarkSummary>(`/students/${studentId}/remarks`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: remarkKeys.all });
    },
  });
}
