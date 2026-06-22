import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { lookupKeys } from '@/hooks/useLookups';
import type { TenantLookupOption } from '@/types/lookup';

export type LookupResource = 'admission-categories' | 'document-types';

const resourceKeys: Record<LookupResource, readonly ['lookups', string]> = {
  'admission-categories': lookupKeys.admissionCategories,
  'document-types': lookupKeys.documentTypes,
};

export function useCreateLookupValue(resource: LookupResource) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (value: string) =>
      apiFetch<TenantLookupOption>(`/lookups/${resource}`, {
        method: 'POST',
        body: JSON.stringify({ value }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: resourceKeys[resource] });
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
    },
  });
}
