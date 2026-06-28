import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';
import type {
  AcademicStandardOption,
  AcademicYearOption,
  LookupOption,
  TenantLookupOption,
} from '@/types/lookup';

const LOOKUPS_STALE_TIME = 30 * 60 * 1000;

export const lookupKeys = {
  all: ['lookups'] as const,
  bloodGroups: ['lookups', 'blood-groups'] as const,
  admissionCategories: ['lookups', 'admission-categories'] as const,
  documentTypes: ['lookups', 'document-types'] as const,
  academicStandards: ['lookups', 'academic-standards'] as const,
  sections: ['lookups', 'sections'] as const,
  academicYears: ['lookups', 'academic-years'] as const,
  languages: ['lookups', 'languages'] as const,
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

  const academicStandardsQuery = useQuery({
    queryKey: lookupKeys.academicStandards,
    queryFn: () => apiFetch<AcademicStandardOption[]>('/lookups/academic-standards'),
    enabled,
    staleTime: LOOKUPS_STALE_TIME,
  });

  const sectionsQuery = useQuery({
    queryKey: lookupKeys.sections,
    queryFn: () => apiFetch<TenantLookupOption[]>('/lookups/sections'),
    enabled,
    staleTime: LOOKUPS_STALE_TIME,
  });

  const academicYearsQuery = useQuery({
    queryKey: lookupKeys.academicYears,
    queryFn: () => apiFetch<AcademicYearOption[]>('/lookups/academic-years'),
    enabled,
    staleTime: LOOKUPS_STALE_TIME,
  });

  const languagesQuery = useQuery({
    queryKey: lookupKeys.languages,
    queryFn: () => apiFetch<TenantLookupOption[]>('/lookups/languages'),
    enabled,
    staleTime: LOOKUPS_STALE_TIME,
  });

  const isLoading =
    bloodGroupsQuery.isLoading ||
    admissionCategoriesQuery.isLoading ||
    documentTypesQuery.isLoading ||
    academicStandardsQuery.isLoading ||
    sectionsQuery.isLoading ||
    academicYearsQuery.isLoading ||
    languagesQuery.isLoading;

  const isError =
    bloodGroupsQuery.isError ||
    admissionCategoriesQuery.isError ||
    documentTypesQuery.isError ||
    academicStandardsQuery.isError ||
    sectionsQuery.isError ||
    academicYearsQuery.isError ||
    languagesQuery.isError;

  const currentAcademicYear =
    academicYearsQuery.data?.find((year) => year.isCurrent) ?? academicYearsQuery.data?.[0] ?? null;

  return {
    bloodGroups: bloodGroupsQuery.data ?? [],
    admissionCategories: admissionCategoriesQuery.data ?? [],
    documentTypes: documentTypesQuery.data ?? [],
    academicStandards: (academicStandardsQuery.data ?? []).filter((s) => s.value !== 'Unassigned'),
    sections: sectionsQuery.data ?? [],
    academicYears: academicYearsQuery.data ?? [],
    languages: languagesQuery.data ?? [],
    currentAcademicYear,
    isLoading,
    isError,
    error:
      bloodGroupsQuery.error ??
      admissionCategoriesQuery.error ??
      documentTypesQuery.error ??
      academicStandardsQuery.error ??
      sectionsQuery.error ??
      academicYearsQuery.error ??
      languagesQuery.error,
  };
}
