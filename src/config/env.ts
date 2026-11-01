import Constants from "expo-constants";

/** The live website — used for share links and for the curated library files. */
export const SITE_URL = "https://sharda.social";

/**
 * Where the backend lives.
 *
 * `EXPO_PUBLIC_API_URL` wins when set. In development with it unset we fall
 * back to the machine running Metro on the backend's default port, so a
 * physical device on the same Wi-Fi works with no configuration. A release
 * build never guesses: if the variable is missing the app says so instead of
 * quietly talking to the wrong server.
 */
function resolveOrigin(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (explicit) return explicit;

  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) return `http://${hostUri.split(":")[0]}:5000`;
  }
  return "";
}

export const API_ORIGIN = resolveOrigin();
export const API_BASE_URL = `${API_ORIGIN}/api/v1`;
export const isApiConfigured = API_ORIGIN.length > 0;
