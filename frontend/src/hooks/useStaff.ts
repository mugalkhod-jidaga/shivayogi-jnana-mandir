import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPaginated, apiFetchWithMeta } from '@/lib/api';
import type {
  CreateStaffPayload,
  Role,
  StaffMember,
  TempPasswordMeta,
  UpdateStaffPayload,
} from '@/types/user';

export const staffKeys = {
  all: ['staff'] as const,
  lists: () => [...staffKeys.all, 'list'] as const,
  list: (page: number, limit: number, search: string) =>
    [...staffKeys.lists(), { page, limit, search }] as const,
  roles: ['roles'] as const,
};

type UseStaffListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export function useStaffList({ page = 1, limit = 20, search = '' }: UseStaffListParams = {}) {
  const queryString = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
  }).toString();

  return useQuery({
    queryKey: staffKeys.list(page, limit, search),
    queryFn: () => apiFetchPaginated<StaffMember>(`/users?${queryString}`),
    placeholderData: (previous) => previous,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: staffKeys.roles,
    queryFn: () => apiFetch<Role[]>('/roles'),
    staleTime: 30 * 60 * 1000,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStaffPayload) =>
      apiFetchWithMeta<StaffMember, TempPasswordMeta>('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
  });
}

export function useUpdateStaff(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateStaffPayload) =>
      apiFetch<StaffMember>(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
  });
}

export function useDeactivateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<StaffMember>(`/users/${id}/deactivate`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
  });
}

export function useResetStaffPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetchWithMeta<StaffMember, TempPasswordMeta>(`/users/${id}/reset-password`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
    },
  });
}
