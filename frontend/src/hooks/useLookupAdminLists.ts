import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { lookupKeys } from '@/hooks/useLookups';
import { apiFetch } from '@/lib/api';
import { getApiLocale } from '@/lib/i18n';
import type { AcademicStandardOption, TenantLookupOption } from '@/types/lookup';

const LOOKUPS_STALE_TIME = 30 * 60 * 1000;
const ADMIN_SUFFIX = 'admin';

function adminQueryKey(base: readonly string[], localeKey: string) {
  return [...base, ADMIN_SUFFIX, localeKey] as const;
}

export function useLookupAdminLists() {
  const { session } = useAuth();
  const { i18n } = useTranslation();
  const locale = getApiLocale();
  const enabled = Boolean(session);
  const localeKey = i18n.language?.split('-')[0] ?? locale;
  const inactiveParam = '?includeInactive=1';

  const admissionCategoriesQuery = useQuery({
    queryKey: adminQueryKey(lookupKeys.admissionCategories, localeKey),
    queryFn: () =>
      apiFetch<TenantLookupOption[]>(`/lookups/admission-categories${inactiveParam}`),
    enabled,
    staleTime: LOOKUPS_STALE_TIME,
  });

  const documentTypesQuery = useQuery({
    queryKey: adminQueryKey(lookupKeys.documentTypes, localeKey),
    queryFn: () => apiFetch<TenantLookupOption[]>(`/lookups/document-types${inactiveParam}`),
    enabled,
    staleTime: LOOKUPS_STALE_TIME,
  });

  const academicStandardsQuery = useQuery({
    queryKey: adminQueryKey(lookupKeys.academicStandards, localeKey),
    queryFn: () =>
      apiFetch<AcademicStandardOption[]>(`/lookups/academic-standards${inactiveParam}`),
    enabled,
    staleTime: LOOKUPS_STALE_TIME,
  });

  const sectionsQuery = useQuery({
    queryKey: adminQueryKey(lookupKeys.sections, localeKey),
    queryFn: () => apiFetch<TenantLookupOption[]>(`/lookups/sections${inactiveParam}`),
    enabled,
    staleTime: LOOKUPS_STALE_TIME,
  });

  const languagesQuery = useQuery({
    queryKey: adminQueryKey(lookupKeys.languages, localeKey),
    queryFn: () => apiFetch<TenantLookupOption[]>(`/lookups/languages${inactiveParam}`),
    enabled,
    staleTime: LOOKUPS_STALE_TIME,
  });

  const isLoading =
    admissionCategoriesQuery.isLoading ||
    documentTypesQuery.isLoading ||
    academicStandardsQuery.isLoading ||
    sectionsQuery.isLoading ||
    languagesQuery.isLoading;

  const isError =
    admissionCategoriesQuery.isError ||
    documentTypesQuery.isError ||
    academicStandardsQuery.isError ||
    sectionsQuery.isError ||
    languagesQuery.isError;

  return {
    admissionCategories: admissionCategoriesQuery.data ?? [],
    documentTypes: documentTypesQuery.data ?? [],
    academicStandards: academicStandardsQuery.data ?? [],
    sections: sectionsQuery.data ?? [],
    languages: languagesQuery.data ?? [],
    isLoading,
    isError,
  };
}
