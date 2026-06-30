import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';
import { getApiLocale } from '@/lib/i18n';
import type { HostelAttendanceStatusOption } from '@/types/hostel';
import type { MedicalRecordTypeOption } from '@/types/medical';
import type { RemarkCategoryOption, RemarkTypeOption } from '@/types/remark';
import type { TenantLookupOption } from '@/types/lookup';

const STALE = 30 * 60 * 1000;

export const phase2LookupKeys = {
  remarkTypes: ['lookups', 'remark-types'] as const,
  remarkCategories: ['lookups', 'remark-categories'] as const,
  hostelAttendanceStatuses: ['lookups', 'hostel-attendance-statuses'] as const,
  medicalRecordTypes: ['lookups', 'medical-record-types'] as const,
};

export function usePhase2Lookups() {
  const { session } = useAuth();
  const { i18n } = useTranslation();
  const localeKey = i18n.language?.split('-')[0] ?? getApiLocale();
  const enabled = Boolean(session);

  const remarkTypes = useQuery({
    queryKey: [...phase2LookupKeys.remarkTypes, localeKey],
    queryFn: () => apiFetch<RemarkTypeOption[]>('/lookups/remark-types'),
    enabled,
    staleTime: STALE,
  });

  const remarkCategories = useQuery({
    queryKey: [...phase2LookupKeys.remarkCategories, localeKey],
    queryFn: () => apiFetch<RemarkCategoryOption[]>('/lookups/remark-categories'),
    enabled,
    staleTime: STALE,
  });

  const hostelAttendanceStatuses = useQuery({
    queryKey: [...phase2LookupKeys.hostelAttendanceStatuses, localeKey],
    queryFn: () => apiFetch<HostelAttendanceStatusOption[]>('/lookups/hostel-attendance-statuses'),
    enabled,
    staleTime: STALE,
  });

  const medicalRecordTypes = useQuery({
    queryKey: [...phase2LookupKeys.medicalRecordTypes, localeKey],
    queryFn: () => apiFetch<MedicalRecordTypeOption[]>('/lookups/medical-record-types'),
    enabled,
    staleTime: STALE,
  });

  return {
    remarkTypes: remarkTypes.data ?? [],
    remarkCategories: remarkCategories.data ?? [],
    hostelAttendanceStatuses: hostelAttendanceStatuses.data ?? [],
    medicalRecordTypes: medicalRecordTypes.data ?? [],
    isLoading:
      remarkTypes.isLoading ||
      remarkCategories.isLoading ||
      hostelAttendanceStatuses.isLoading ||
      medicalRecordTypes.isLoading,
  };
}

export type { TenantLookupOption };
