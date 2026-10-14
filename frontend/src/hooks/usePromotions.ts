import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { studentKeys } from '@/hooks/useStudents';
import type {
  EnrollmentStats,
  PromoteStudentsPayload,
  PromotionCandidates,
  PromotionResult,
} from '@/types/promotion';

export const enrollmentStatsKeys = {
  all: ['enrollment-stats'] as const,
  filtered: (academicYearId?: number, standardId?: number, status?: string) =>
    [...enrollmentStatsKeys.all, { academicYearId, standardId, status }] as const,
};

type EnrollmentStatsParams = {
  academicYearId?: number;
  standardId?: number;
  status?: string;
};

export function useEnrollmentStats(
  params: EnrollmentStatsParams,
  options: { enabled?: boolean } = {},
) {
  const query = new URLSearchParams();
  if (params.academicYearId) query.set('academicYearId', String(params.academicYearId));
  if (params.standardId) query.set('standardId', String(params.standardId));
  if (params.status) query.set('status', params.status);
  const queryString = query.toString();

  return useQuery({
    queryKey: enrollmentStatsKeys.filtered(params.academicYearId, params.standardId, params.status),
    queryFn: () =>
      apiFetch<EnrollmentStats>(`/students/reports/enrollment-stats${queryString ? `?${queryString}` : ''}`),
    enabled: options.enabled ?? true,
  });
}

export const promotionCandidatesKeys = {
  all: ['promotion-candidates'] as const,
  filtered: (sourceStandardId?: number, targetAcademicYearId?: number) =>
    [...promotionCandidatesKeys.all, { sourceStandardId, targetAcademicYearId }] as const,
};

/**
 * Active students in `sourceStandardId` from the academic year immediately
 * before `targetAcademicYearId`. The server owns that rule.
 */
export function usePromotionCandidates(params: {
  sourceStandardId?: number;
  targetAcademicYearId?: number;
}) {
  const enabled = Boolean(params.sourceStandardId && params.targetAcademicYearId);

  return useQuery({
    queryKey: promotionCandidatesKeys.filtered(params.sourceStandardId, params.targetAcademicYearId),
    queryFn: () =>
      apiFetch<PromotionCandidates>(
        `/students/promotions/candidates?sourceStandardId=${params.sourceStandardId}&targetAcademicYearId=${params.targetAcademicYearId}`,
      ),
    enabled,
    retry: false,
  });
}

export function usePromoteStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PromoteStudentsPayload) =>
      apiFetch<PromotionResult>('/students/promotions', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (result) => {
      if (!result.dryRun) {
        void queryClient.invalidateQueries({ queryKey: studentKeys.all });
        void queryClient.invalidateQueries({ queryKey: enrollmentStatsKeys.all });
        void queryClient.invalidateQueries({ queryKey: promotionCandidatesKeys.all });
      }
    },
  });
}
