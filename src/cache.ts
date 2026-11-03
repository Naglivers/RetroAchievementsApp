import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PREFIX = 'checkpoint.api-cache.';
const DEFAULT_TTL_MS = 5 * 60 * 1000;

type CacheEntry = { expiresAt: number; value: unknown };

function keyFor(key: string) {
  return `${PREFIX}${key}`;
}

async function read(key: string): Promise<CacheEntry | null> {
  try {
    const raw = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(keyFor(key))
      : await SecureStore.getItemAsync(keyFor(key));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (!entry || typeof entry.expiresAt !== 'number' || entry.expiresAt <= Date.now()) {
      await remove(key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

async function write(key: string, value: unknown, ttlMs: number) {
  const raw = JSON.stringify({ expiresAt: Date.now() + ttlMs, value });
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(keyFor(key), raw);
  } else {
    await SecureStore.setItemAsync(keyFor(key), raw);
  }
}

async function remove(key: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(keyFor(key));
  } else {
    await SecureStore.deleteItemAsync(keyFor(key));
  }
}

export async function cachedJson<T>(key: string, load: () => Promise<T>, ttlMs = DEFAULT_TTL_MS): Promise<T> {
  const cached = await read(key);
  if (cached) return cached.value as T;
  const value = await load();
  try { await write(key, value, ttlMs); } catch { /* cache failure must not break the app */ }
  return value;
}
