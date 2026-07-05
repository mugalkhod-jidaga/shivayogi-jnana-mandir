import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { StudentReportSummary } from '@/types/studentReports';
import { studentKeys } from '@/hooks/useStudents';

export function useStudentReports() {
  return useQuery({
    queryKey: [...studentKeys.all, 'reports'] as const,
    queryFn: () => apiFetch<StudentReportSummary>('/students/reports'),
    staleTime: 60_000,
  });
}
