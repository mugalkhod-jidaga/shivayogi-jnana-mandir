import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { MeResponse } from '@/types/user';

export function useMe() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['me', session?.user.id],
    enabled: Boolean(session),
    queryFn: () => apiFetch<MeResponse>('/users/me'),
    staleTime: 5 * 60 * 1000,
  });
}
