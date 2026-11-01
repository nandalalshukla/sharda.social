import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/config/env";
import { tokenStore } from "./tokenStore";

/**
 * One axios instance for the whole app.
 *
 * Auth differs from the website on purpose: the site rides on httpOnly
 * cookies, which a native client can't rely on, so the backend (see
 * `utils/clientTokens.ts` there) hands this client its tokens in the response
 * body when it identifies itself with `X-Client-Platform: mobile`. They go
 * back as `Authorization: Bearer` and `X-Refresh-Token`.
 */
const COMMON_HEADERS = {
  "Content-Type": "application/json",
  "X-Client-Platform": "mobile",
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: COMMON_HEADERS,
  // The API is hosted on a platform that sleeps idle instances; the first
  // request after a quiet spell can take most of a minute. Matches the web.
  timeout: 50_000,
});

// A bare instance with no interceptors, for the refresh call itself — it must
// never recurse into the logic that triggers a refresh.
const bare = axios.create({
  baseURL: API_BASE_URL,
  headers: COMMON_HEADERS,
  timeout: 20_000,
});

let onSessionExpired: (() => void) | null = null;
/** The auth store registers here so a dead session signs the user out in the UI. */
export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  onSessionExpired = handler;
};

/** Milliseconds until the JWT expires; `Infinity` if it can't be read. */
function msUntilExpiry(token: string): number {
  try {
    const part = token.split(".")[1];
    if (!part) return Infinity;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const { exp } = JSON.parse(atob(padded)) as { exp?: number };
    return exp ? exp * 1000 - Date.now() : Infinity;
  } catch {
    return Infinity;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Trades the refresh token for a new pair. Concurrent callers share one
 * request — the backend rotates the refresh token on every use, so two
 * simultaneous refreshes would invalidate each other and sign the user out.
 */
export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function doRefresh(): Promise<boolean> {
  const refresh = tokenStore.refresh;
  if (!refresh) return false;

  try {
    const res = await bare.post(
      "/auth/refresh-token",
      {},
      { headers: { "X-Refresh-Token": refresh } },
    );
    const tokens = res.data?.data?.tokens as
      | { accessToken: string; refreshToken: string }
      | undefined;
    if (!tokens) return false;
    await tokenStore.set(tokens.accessToken, tokens.refreshToken);
    return true;
  } catch (error) {
    // Only a definitive "no" ends the session. A dropped connection or a
    // sleeping server must not sign someone out of their account.
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status === 400 || status === 401 || status === 403) {
      await tokenStore.clear();
      onSessionExpired?.();
    }
    return false;
  }
}

const isAuthEndpoint = (url = "") =>
  /\/auth\/(login|register|refresh-token|logout|verify-email|resend-otp|forgot-password|reset-password)/.test(
    url,
  );

api.interceptors.request.use(async (config) => {
  if (isAuthEndpoint(config.url)) return config;

  // Refresh a little early. Optional-auth endpoints (the feed, profiles) treat
  // an expired token as "anonymous" instead of answering 401, so waiting for a
  // 401 would silently show a signed-in user the logged-out version of the app.
  if (tokenStore.access && tokenStore.refresh && msUntilExpiry(tokenStore.access) < 30_000) {
    await refreshSession();
  }

  if (tokenStore.access) {
    config.headers.set("Authorization", `Bearer ${tokenStore.access}`);
  }
  return config;
});

type Retryable = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as Retryable | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !isAuthEndpoint(original.url) &&
      tokenStore.refresh
    ) {
      original._retried = true;
      if (await refreshSession()) {
        original.headers.set("Authorization", `Bearer ${tokenStore.access}`);
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
