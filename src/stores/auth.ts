import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import * as authApi from "@/api/auth";
import { setSessionExpiredHandler } from "@/api/client";
import { tokenStore } from "@/api/tokenStore";
import type { AuthUser, RawAuthUser, TokenPair } from "@/api/types";
import { queryClient } from "@/lib/queryClient";

const USER_KEY = "auth.user";

type Status = "loading" | "authed" | "guest";

interface AuthState {
  user: AuthUser | null;
  status: Status;
  /** Reads the keychain and restores the session. Runs once, behind the splash. */
  bootstrap: () => Promise<void>;
  /** Completes a login or email verification. */
  signIn: (payload: { user: RawAuthUser; tokens?: TokenPair }) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  refreshUser: () => Promise<void>;
}

const persistUser = (user: AuthUser | null) =>
  user
    ? AsyncStorage.setItem(USER_KEY, JSON.stringify(user)).catch(() => undefined)
    : AsyncStorage.removeItem(USER_KEY).catch(() => undefined);

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "loading",

  bootstrap: async () => {
    await tokenStore.hydrate();

    if (!tokenStore.refresh) {
      set({ user: null, status: "guest" });
      return;
    }

    // Show the last known user straight away so a returning student lands in
    // a signed-in app with no spinner — even with a slow server or no signal —
    // then confirm in the background.
    try {
      const cached = await AsyncStorage.getItem(USER_KEY);
      if (cached) set({ user: JSON.parse(cached) as AuthUser, status: "authed" });
    } catch {
      /* a bad cache just means we wait for the network */
    }

    try {
      const user = await authApi.getMe();
      set({ user, status: "authed" });
      persistUser(user);
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      // Only a definitive auth failure signs the user out. A timeout or a
      // sleeping server keeps the cached session.
      if (status === 401 || status === 403) {
        await get().signOut();
      } else if (!get().user) {
        set({ status: "guest" });
      }
    }
  },

  signIn: async ({ user, tokens }) => {
    if (!tokens) throw new Error("The server did not return a session. Please try again.");
    await tokenStore.set(tokens.accessToken, tokens.refreshToken);
    const normalized = authApi.normalizeAuthUser(user);
    queryClient.clear();
    set({ user: normalized, status: "authed" });
    persistUser(normalized);
  },

  signOut: async () => {
    // Tell the server first so the session is revoked there too; if we're
    // offline that's fine — the local tokens are dropped regardless.
    if (tokenStore.refresh) await authApi.logout().catch(() => undefined);
    await tokenStore.clear();
    queryClient.clear();
    set({ user: null, status: "guest" });
    persistUser(null);
  },

  setUser: (user) => {
    set({ user });
    persistUser(user);
  },

  refreshUser: async () => {
    try {
      get().setUser(await authApi.getMe());
    } catch {
      /* keep what we have */
    }
  },
}));

// A refresh the server definitively rejected means the session is over.
setSessionExpiredHandler(() => {
  queryClient.clear();
  useAuthStore.setState({ user: null, status: "guest" });
  persistUser(null);
});

export const useIsAuthed = () => useAuthStore((s) => s.status === "authed");
