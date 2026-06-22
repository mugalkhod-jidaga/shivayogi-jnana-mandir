import { useQuery } from '@tanstack/react-query';
import { apiFetchPaginated } from '@/lib/api';
import type { StudentSummary } from '@/types/student';

export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (page: number, limit: number, search: string) =>
    [...studentKeys.lists(), { page, limit, search }] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};

type UseStudentsListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export function useStudentsList({ page = 1, limit = 20, search = '' }: UseStudentsListParams = {}) {
  const queryString = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
  }).toString();

  return useQuery({
    queryKey: studentKeys.list(page, limit, search),
    queryFn: () => apiFetchPaginated<StudentSummary>(`/students?${queryString}`),
    placeholderData: (previous) => previous,
  });
}
