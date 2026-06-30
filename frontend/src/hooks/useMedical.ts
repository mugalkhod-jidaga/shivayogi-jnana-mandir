import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated } from '@/lib/api';
import type { CreateMedicalRecordInput, MedicalListFilters, MedicalRecord } from '@/types/medical';

export const medicalKeys = {
  all: ['medical'] as const,
  list: (filters: MedicalListFilters) => [...medicalKeys.all, 'list', filters] as const,
  byStudent: (studentId: string, filters: MedicalListFilters) =>
    [...medicalKeys.all, 'student', studentId, filters] as const,
};

function buildQuery(filters: MedicalListFilters) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 20),
  });
  if (filters.search) params.set('search', filters.search);
  if (filters.typeId) params.set('typeId', String(filters.typeId));
  if (filters.studentId) params.set('studentId', filters.studentId);
  return params.toString();
}

export function useMedicalRecordsList(filters: MedicalListFilters = {}) {
  const normalized = { page: 1, limit: 20, ...filters };
  return useQuery({
    queryKey: medicalKeys.list(normalized),
    queryFn: () => apiFetchPaginated<MedicalRecord>(`/medical-records?${buildQuery(normalized)}`),
    placeholderData: (prev) => prev,
  });
}

export function useStudentMedicalRecords(studentId: string | undefined, filters: MedicalListFilters = {}) {
  const normalized = { page: 1, limit: 20, ...filters };
  return useQuery({
    queryKey: medicalKeys.byStudent(studentId ?? '', normalized),
    queryFn: () =>
      apiFetchPaginated<MedicalRecord>(
        `/students/${studentId}/medical-records?${buildQuery(normalized)}`,
      ),
    enabled: Boolean(studentId),
  });
}

export function useCreateMedicalRecord(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMedicalRecordInput) =>
      apiFetch<MedicalRecord>(`/students/${studentId}/medical-records`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: medicalKeys.all });
    },
  });
}
