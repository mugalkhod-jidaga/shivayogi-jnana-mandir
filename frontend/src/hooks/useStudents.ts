import { useQuery } from '@tanstack/react-query';
import { apiFetchPaginated } from '@/lib/api';
import type { StudentListFilters, StudentSummary } from '@/types/student';

export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filters: StudentListFilters) => [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};

function buildQueryString(filters: StudentListFilters) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 20),
  });

  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.standardId) params.set('standardId', String(filters.standardId));
  if (filters.sectionId) params.set('sectionId', String(filters.sectionId));
  if (filters.academicYearId) params.set('academicYearId', String(filters.academicYearId));
  if (filters.socialCategoryId) {
    params.set('socialCategoryId', String(filters.socialCategoryId));
  }

  return params.toString();
}

export function useStudentsList(filters: StudentListFilters = {}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const normalizedFilters = { ...filters, page, limit };
  const queryString = buildQueryString(normalizedFilters);

  return useQuery({
    queryKey: studentKeys.list(normalizedFilters),
    queryFn: () => apiFetchPaginated<StudentSummary>(`/students?${queryString}`),
    placeholderData: (previous) => previous,
  });
}
