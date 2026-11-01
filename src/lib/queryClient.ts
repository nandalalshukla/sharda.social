import { focusManager, onlineManager, QueryClient } from "@tanstack/react-query";
import axios from "axios";
import * as Network from "expo-network";
import { AppState, Platform } from "react-native";

/**
 * Server state lives in React Query: it caches, de-duplicates, retries and
 * refetches, which is most of what keeps a feed app feeling instant.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        // A 4xx is the server saying "no", not a hiccup — retrying won't change it.
        if (axios.isAxiosError(error) && error.response && error.response.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// React Query assumes a browser. Teach it what "the app came back to the
// foreground" and "the phone regained signal" mean on a device.
focusManager.setEventListener((handleFocus) => {
  const sub = AppState.addEventListener("change", (state) => {
    if (Platform.OS !== "web") handleFocus(state === "active");
  });
  return () => sub.remove();
});

onlineManager.setEventListener((setOnline) => {
  const sub = Network.addNetworkStateListener((state) => {
    setOnline(Boolean(state.isConnected));
  });
  return () => sub.remove();
});
