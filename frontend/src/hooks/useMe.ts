import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { MeResponse } from '@/types/user';

export function useMe() {
  const { session, getAccessToken } = useAuth();

  return useQuery({
    queryKey: ['me', session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      return apiFetch<MeResponse>('/users/me', { token });
    },
    staleTime: 5 * 60 * 1000,
  });
}
