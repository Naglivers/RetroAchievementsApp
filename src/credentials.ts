import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const USERNAME_KEY = 'checkpoint.ra.username';
const API_KEY = 'checkpoint.ra.api-key';

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
