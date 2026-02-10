interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/**
 * Simple in-memory cache with TTL.
 * Returns cached data if fresh, otherwise calls `fetcher` and caches the result.
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number
): Promise<T> {
  const existing = store.get(key) as CacheEntry<T> | undefined;
  if (existing && Date.now() < existing.expiresAt) {
    return existing.data;
  }

  const data = await fetcher();
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

/** Invalidate a specific cache key. */
export function invalidateCache(key: string): void {
  store.delete(key);
}

/** Invalidate all keys matching a prefix. */
export function invalidateCacheByPrefix(prefix: string): void {
  const keysToDelete: string[] = [];
  store.forEach((_, key) => {
    if (key.startsWith(prefix)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => store.delete(key));
}
