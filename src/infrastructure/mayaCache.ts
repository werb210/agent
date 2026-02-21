import { redis } from "./redis";

export async function cacheSet(key: string, value: unknown, ttl = 300) {
  await redis.set(key, JSON.stringify(value), "EX", ttl);
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  return data ? (JSON.parse(data) as T) : null;
}
