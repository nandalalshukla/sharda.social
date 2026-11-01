// Each weight is imported from its own entry point: the package root pulls in
// all eighteen weights (~6 MB) when the app uses five.
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { Inter_800ExtraBold } from "@expo-google-fonts/inter/800ExtraBold";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { StyleSheet, Text as RNText, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AnimatedSplash } from "@/components/AnimatedSplash";
import { DialogHost, iconFonts, ToastHost } from "@/components/ui";
import { isApiConfigured } from "@/config/env";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/auth";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { fonts } from "@/theme/tokens";

// Keep the native splash up until fonts are ready; the animated splash takes
// over from there. Must run at module scope, before first render.
SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ duration: 250, fade: true });

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    ...iconFonts,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hide();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AppShell />
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const { colors, isDark } = useTheme();
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (!isApiConfigured) return <MissingConfig />;

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontFamily: fonts.bold, fontSize: 17 },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="compose" options={{ title: "New post", presentation: "modal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="upload" options={{ title: "Share study material", presentation: "modal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="post/[id]" options={{ title: "Post" }} />
        <Stack.Screen name="profile/[userId]" options={{ title: "Profile" }} />
        <Stack.Screen name="connections/[userId]" options={{ title: "Connections" }} />
        <Stack.Screen name="library/[kind]" options={{ title: "Library" }} />
        <Stack.Screen name="pyq/[id]" options={{ title: "Question paper" }} />
        <Stack.Screen name="my-uploads" options={{ title: "My uploads" }} />
        <Stack.Screen name="contributors" options={{ title: "Top contributors" }} />
        <Stack.Screen name="about" options={{ title: "About" }} />
        <Stack.Screen name="settings/index" options={{ title: "Settings" }} />
        <Stack.Screen name="settings/edit-profile" options={{ title: "Edit profile" }} />
        <Stack.Screen name="settings/change-password" options={{ title: "Change password" }} />
        <Stack.Screen name="settings/request-mod" options={{ title: "Become a moderator" }} />
        <Stack.Screen name="mod/index" options={{ title: "Moderator" }} />
        <Stack.Screen name="admin/index" options={{ title: "Admin" }} />
      </Stack>

      <ToastHost />
      <DialogHost />
      <AnimatedSplash ready={status !== "loading"} />
    </View>
  );
}

/** Shown instead of a baffling network error when a build has no backend URL. */
function MissingConfig() {
  return (
    <View style={[styles.fill, styles.center]}>
      <RNText style={styles.configTitle}>Backend URL not set</RNText>
      <RNText style={styles.configBody}>
        Set EXPO_PUBLIC_API_URL in the app's .env file (see .env.example) and rebuild.
      </RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "#fff" },
  configTitle: { fontFamily: fonts.bold, fontSize: 20, marginBottom: 8, color: "#15131f" },
  configBody: { fontFamily: fonts.regular, fontSize: 15, textAlign: "center", color: "#6b6478" },
});
