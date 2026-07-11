import type { MeResponse } from '@/types/user';

const ME_CACHE_KEY = 'sjm:me-cache';

type MeCacheEntry = {
  userId: string;
  data: MeResponse;
};

export function readMeCache(userId: string): MeResponse | undefined {
  try {
    const raw = sessionStorage.getItem(ME_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as MeCacheEntry;
    if (parsed.userId !== userId || !parsed.data) return undefined;
    return parsed.data;
  } catch {
    return undefined;
  }
}

export function writeMeCache(userId: string, data: MeResponse): void {
  try {
    const entry: MeCacheEntry = { userId, data };
    sessionStorage.setItem(ME_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore quota / private-mode failures
  }
}

export function clearMeCache(): void {
  try {
    sessionStorage.removeItem(ME_CACHE_KEY);
  } catch {
    // ignore
  }
}
