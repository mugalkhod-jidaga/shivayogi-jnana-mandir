import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';
import { getApiLocale } from '@/lib/i18n';
import type { DoseUnitOption, HealthLookupOption } from '@/types/health';
import type { TenantLookupOption } from '@/types/lookup';

const STALE = 30 * 60 * 1000;

export const healthLookupKeys = {
  severities: ['lookups', 'health-severities'] as const,
  issueTypes: ['lookups', 'health-issue-types'] as const,
  foodTimings: ['lookups', 'medicine-food-timings'] as const,
  doseUnits: ['lookups', 'medicine-dose-units'] as const,
  schedulePresets: ['lookups', 'medicine-schedule-presets'] as const,
};

export function useHealthLookups() {
  const { session } = useAuth();
  const { i18n } = useTranslation();
  const localeKey = i18n.language?.split('-')[0] ?? getApiLocale();
  const enabled = Boolean(session);

  const severities = useQuery({
    queryKey: [...healthLookupKeys.severities, localeKey],
    queryFn: () => apiFetch<(HealthLookupOption & { code: string })[]>('/lookups/health-severities'),
    enabled,
    staleTime: STALE,
  });

  const issueTypes = useQuery({
    queryKey: [...healthLookupKeys.issueTypes, localeKey],
    queryFn: () => apiFetch<TenantLookupOption[]>('/lookups/health-issue-types'),
    enabled,
    staleTime: STALE,
  });

  const foodTimings = useQuery({
    queryKey: [...healthLookupKeys.foodTimings, localeKey],
    queryFn: () => apiFetch<(HealthLookupOption & { code: string })[]>('/lookups/medicine-food-timings'),
    enabled,
    staleTime: STALE,
  });

  const doseUnits = useQuery({
    queryKey: [...healthLookupKeys.doseUnits, localeKey],
    queryFn: () => apiFetch<DoseUnitOption[]>('/lookups/medicine-dose-units'),
    enabled,
    staleTime: STALE,
  });

  const schedulePresets = useQuery({
    queryKey: [...healthLookupKeys.schedulePresets, localeKey],
    queryFn: () =>
      apiFetch<(HealthLookupOption & { code: string })[]>('/lookups/medicine-schedule-presets'),
    enabled,
    staleTime: STALE,
  });

  return {
    severities: severities.data ?? [],
    issueTypes: issueTypes.data ?? [],
    foodTimings: foodTimings.data ?? [],
    doseUnits: doseUnits.data ?? [],
    schedulePresets: schedulePresets.data ?? [],
    isLoading:
      severities.isLoading ||
      issueTypes.isLoading ||
      foodTimings.isLoading ||
      doseUnits.isLoading ||
      schedulePresets.isLoading,
  };
}

export const EMPTY_SCHEDULE = (): { morning: boolean; noon: boolean; evening: boolean; night: boolean } => ({
  morning: false,
  noon: false,
  evening: false,
  night: false,
});

export function presetSchedule(code: string) {
  switch (code) {
    case 'once_morning':
      return { morning: true, noon: false, evening: false, night: false };
    case 'twice_daily':
      return { morning: true, noon: false, evening: true, night: false };
    case 'thrice_daily':
      return { morning: true, noon: true, evening: true, night: false };
    default:
      return EMPTY_SCHEDULE();
  }
}
