import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';
import type { LookupOption, TenantLookupOption } from '@/types/lookup';

const LOOKUPS_STALE_TIME = 30 * 60 * 1000;

export const lookupKeys = {
  all: ['lookups'] as const,
  bloodGroups: ['lookups', 'blood-groups'] as const,
  admissionCategories: ['lookups', 'admission-categories'] as const,
  documentTypes: ['lookups', 'document-types'] as const,
};

export function useLookups() {
  const { session } = useAuth();
  const enabled = Boolean(session);

  const bloodGroupsQuery = useQuery({
    queryKey: lookupKeys.bloodGroups,
    queryFn: () => apiFetch<LookupOption[]>('/lookups/blood-groups'),
    enabled,
    staleTime: LOOKUPS_STALE_TIME,
  });

  const admissionCategoriesQuery = useQuery({
    queryKey: lookupKeys.admissionCategories,
    queryFn: () => apiFetch<TenantLookupOption[]>('/lookups/admission-categories'),
    enabled,
    staleTime: LOOKUPS_STALE_TIME,
  });

  const documentTypesQuery = useQuery({
    queryKey: lookupKeys.documentTypes,
    queryFn: () => apiFetch<TenantLookupOption[]>('/lookups/document-types'),
    enabled,
    staleTime: LOOKUPS_STALE_TIME,
  });

  return {
    bloodGroups: bloodGroupsQuery.data ?? [],
    admissionCategories: admissionCategoriesQuery.data ?? [],
    documentTypes: documentTypesQuery.data ?? [],
    isLoading:
      bloodGroupsQuery.isLoading ||
      admissionCategoriesQuery.isLoading ||
      documentTypesQuery.isLoading,
    isError:
      bloodGroupsQuery.isError ||
      admissionCategoriesQuery.isError ||
      documentTypesQuery.isError,
    error:
      bloodGroupsQuery.error ??
      admissionCategoriesQuery.error ??
      documentTypesQuery.error,
  };
}
