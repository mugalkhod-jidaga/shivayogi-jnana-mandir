import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { lookupKeys } from '@/hooks/useLookups';
import type { AcademicYearOption } from '@/types/lookup';

export type CreateAcademicYearPayload = {
  label: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
};

export type UpdateAcademicYearPayload = {
  label?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  isActive?: boolean;
};

function invalidateAcademicYears(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: lookupKeys.academicYears });
  void queryClient.invalidateQueries({ queryKey: lookupKeys.all });
}

/**
 * Same endpoint the public `useLookups()` academic-years query reads —
 * sharing `lookupKeys.academicYears` means a newly added year shows up
 * immediately everywhere (student form, promotion wizard) once this
 * invalidates, no separate admin-only cache to keep in sync.
 */
export function useAcademicYearsAdmin() {
  return useQuery({
    queryKey: lookupKeys.academicYears,
    queryFn: () => apiFetch<AcademicYearOption[]>('/lookups/academic-years'),
  });
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAcademicYearPayload) =>
      apiFetch<AcademicYearOption>('/lookups/academic-years', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => invalidateAcademicYears(queryClient),
  });
}

export function useUpdateAcademicYear(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAcademicYearPayload) =>
      apiFetch<AcademicYearOption>(`/lookups/academic-years/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => invalidateAcademicYears(queryClient),
  });
}
