/**
 * Minimal key/value store abstraction with atomic compare-and-swap.
 *
 * In-memory backend is used automatically when no Redis env vars are set
 * (great for local dev). On Vercel, serverless functions don't share
 * memory across instances, so set UPSTASH_REDIS_REST_URL /
 * UPSTASH_REDIS_REST_TOKEN (free tier at upstash.com, one-click add from
 * the Vercel Marketplace) to get a real shared store in production.
 */
export interface KVStore {
  get(key: string): Promise<string | null>;
  /** Set newValue only if the current value === expectedOldValue (null = key must not exist). */
  cas(
    key: string,
    expectedOldValue: string | null,
    newValue: string,
    ttlSeconds: number,
  ): Promise<boolean>;
  del(key: string): Promise<void>;
}

class MemoryStore implements KVStore {
  private map: Map<string, { value: string; expiresAt: number }>;

  constructor() {
    const g = globalThis as unknown as {
      __imposterMemoryStore?: Map<string, { value: string; expiresAt: number }>;
    };
    if (!g.__imposterMemoryStore) {
      g.__imposterMemoryStore = new Map();
    }
    this.map = g.__imposterMemoryStore;
  }

  private read(key: string): string | null {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.map.delete(key);
      return null;
    }
    return entry.value;
  }

  async get(key: string): Promise<string | null> {
    return this.read(key);
  }

  async cas(
    key: string,
    expectedOldValue: string | null,
    newValue: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const current = this.read(key);
    if (current !== expectedOldValue) return false;
    this.map.set(key, { value: newValue, expiresAt: Date.now() + ttlSeconds * 1000 });
    return true;
  }

  async del(key: string): Promise<void> {
    this.map.delete(key);
  }
}

class RedisStore implements KVStore {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/+$/, "");
    this.token = token;
  }

  private async command(parts: (string | number)[]): Promise<unknown> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parts),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Redis command failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as { result: unknown; error?: string };
    if (data.error) throw new Error(`Redis error: ${data.error}`);
    return data.result;
  }

  async get(key: string): Promise<string | null> {
    const result = await this.command(["GET", key]);
    return (result as string | null) ?? null;
  }

  async cas(
    key: string,
    expectedOldValue: string | null,
    newValue: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    // Atomic compare-and-swap via a Lua script run server-side on Redis.
    const script = `
      local current = redis.call('GET', KEYS[1])
      if (current == false and ARGV[1] == '\\0__NULL__\\0') or (current == ARGV[1]) then
        redis.call('SET', KEYS[1], ARGV[2])
        if tonumber(ARGV[3]) > 0 then
          redis.call('EXPIRE', KEYS[1], ARGV[3])
        end
        return 1
      else
        return 0
      end
    `;
    const expected = expectedOldValue === null ? "\0__NULL__\0" : expectedOldValue;
    const result = await this.command([
      "EVAL",
      script,
      "1",
      key,
      expected,
      newValue,
      ttlSeconds,
    ]);
    return result === 1;
  }

  async del(key: string): Promise<void> {
    await this.command(["DEL", key]);
  }
}

let cachedStore: KVStore | null = null;

export function getStore(): KVStore {
  if (cachedStore) return cachedStore;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  cachedStore = url && token ? new RedisStore(url, token) : new MemoryStore();
  return cachedStore;
}
