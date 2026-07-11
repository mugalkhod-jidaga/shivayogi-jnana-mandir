import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { readMeCache, writeMeCache } from '@/lib/meCache';
import { useAuth } from '@/hooks/useAuth';
import type { MeResponse } from '@/types/user';

export function useMe() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['me', userId],
    enabled: Boolean(session && userId),
    queryFn: async () => {
      const data = await apiFetch<MeResponse>('/users/me');
      if (userId) writeMeCache(userId, data);
      return data;
    },
    // Show last known profile immediately; mark stale so a background refresh always runs.
    initialData: () => (userId ? readMeCache(userId) : undefined),
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60 * 1000,
  });
}
