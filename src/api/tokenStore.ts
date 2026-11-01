import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "auth.accessToken";
const REFRESH_KEY = "auth.refreshToken";

/**
 * The session's two tokens.
 *
 * Held in memory so every request can read them synchronously, and mirrored
 * to the OS keychain/keystore so they survive a restart. `hydrate()` must
 * finish before the first authenticated request — the root layout waits on it
 * behind the splash screen.
 */
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const tokenStore = {
  get access() {
    return accessToken;
  },
  get refresh() {
    return refreshToken;
  },

  async hydrate() {
    try {
      [accessToken, refreshToken] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_KEY),
        SecureStore.getItemAsync(REFRESH_KEY),
      ]);
    } catch {
      // A corrupted or unreadable keychain entry means "signed out", not a crash.
      accessToken = null;
      refreshToken = null;
    }
  },

  async set(access: string, refresh: string) {
    accessToken = access;
    refreshToken = refresh;
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, access),
      SecureStore.setItemAsync(REFRESH_KEY, refresh),
    ]);
  },

  async clear() {
    accessToken = null;
    refreshToken = null;
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY).catch(() => undefined),
      SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => undefined),
    ]);
  },
};
