import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const USERNAME_KEY = 'checkpoint.ra.username';
const API_KEY = 'checkpoint.ra.api-key';
const CONSOLE_GAME_COUNTS_KEY = 'checkpoint.ra.console-game-counts';
const CONSOLE_USER_STATS_PREFIX = 'checkpoint.ra.console-user-stats.';

export type CachedConsoleUserStats = Record<string, { played: number; mastered: number }>;

export type RetroAchievementsCredentials = {
  username: string;
  apiKey: string;
};

export async function loadCredentials(): Promise<RetroAchievementsCredentials> {
  if (Platform.OS === 'web') {
    return {
      username: globalThis.localStorage?.getItem(USERNAME_KEY) ?? '',
      apiKey: globalThis.localStorage?.getItem(API_KEY) ?? '',
    };
  }

  const [username, apiKey] = await Promise.all([
    SecureStore.getItemAsync(USERNAME_KEY),
    SecureStore.getItemAsync(API_KEY),
  ]);

  return { username: username ?? '', apiKey: apiKey ?? '' };
}

export async function saveCredentials(credentials: RetroAchievementsCredentials) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(USERNAME_KEY, credentials.username.trim());
    globalThis.localStorage?.setItem(API_KEY, credentials.apiKey.trim());
    return;
  }

  await Promise.all([
    SecureStore.setItemAsync(USERNAME_KEY, credentials.username.trim()),
    SecureStore.setItemAsync(API_KEY, credentials.apiKey.trim()),
  ]);
}

export async function clearCredentials() {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(USERNAME_KEY);
    globalThis.localStorage?.removeItem(API_KEY);
    return;
  }

  await Promise.all([
    SecureStore.deleteItemAsync(USERNAME_KEY),
    SecureStore.deleteItemAsync(API_KEY),
  ]);
}

export async function loadConsoleGameCounts(): Promise<Record<string, number>> {
  try {
    const raw = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(CONSOLE_GAME_COUNTS_KEY)
      : await SecureStore.getItemAsync(CONSOLE_GAME_COUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed as Record<string, number> : {};
  } catch { return {}; }
}

export async function saveConsoleGameCounts(counts: Record<string, number>) {
  const value = JSON.stringify(counts);
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(CONSOLE_GAME_COUNTS_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(CONSOLE_GAME_COUNTS_KEY, value);
}

export async function loadConsoleUserStats(username: string): Promise<CachedConsoleUserStats> {
  if (!username) return {};
  try {
    const key = `${CONSOLE_USER_STATS_PREFIX}${username.toLocaleLowerCase()}`;
    const raw = Platform.OS === 'web' ? globalThis.localStorage?.getItem(key) : await SecureStore.getItemAsync(key);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed as CachedConsoleUserStats : {};
  } catch { return {}; }
}

export async function saveConsoleUserStats(username: string, stats: CachedConsoleUserStats) {
  if (!username) return;
  const key = `${CONSOLE_USER_STATS_PREFIX}${username.toLocaleLowerCase()}`;
  const value = JSON.stringify(stats);
  if (Platform.OS === 'web') { globalThis.localStorage?.setItem(key, value); return; }
  await SecureStore.setItemAsync(key, value);
}
