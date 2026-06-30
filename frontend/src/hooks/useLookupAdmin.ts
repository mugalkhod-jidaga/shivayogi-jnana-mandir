import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { lookupKeys } from '@/hooks/useLookups';
import type { TenantLookupOption } from '@/types/lookup';

export type LookupResource =
  | 'admission-categories'
  | 'document-types'
  | 'academic-standards'
  | 'sections'
  | 'languages';

const resourceKeys: Record<LookupResource, readonly ['lookups', string]> = {
  'admission-categories': lookupKeys.admissionCategories,
  'document-types': lookupKeys.documentTypes,
  'academic-standards': lookupKeys.academicStandards,
  sections: lookupKeys.sections,
  languages: lookupKeys.languages,
};

export type CreateLookupPayload = {
  value: string;
  labelKn?: string;
};

export function useCreateLookupValue(resource: LookupResource) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLookupPayload | string) => {
      const body =
        typeof payload === 'string' ? { value: payload } : { value: payload.value, labelKn: payload.labelKn };
      return apiFetch<TenantLookupOption>(`/lookups/${resource}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: resourceKeys[resource] });
      void queryClient.invalidateQueries({ queryKey: lookupKeys.all });
    },
  });
}

export function useDeactivateLookupValue(resource: LookupResource) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<TenantLookupOption>(`/lookups/${resource}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: false }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: resourceKeys[resource] });
      void queryClient.invalidateQueries({ queryKey: lookupKeys.all });
    },
  });
}

export function useUpdateLookupLabels(resource: LookupResource) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, labelKn }: { id: number; labelKn: string }) =>
      apiFetch<TenantLookupOption>(`/lookups/${resource}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ labelKn: labelKn.trim() || null }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: resourceKeys[resource] });
      void queryClient.invalidateQueries({ queryKey: lookupKeys.all });
    },
  });
}
