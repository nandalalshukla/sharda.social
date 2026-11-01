import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, FeatherName } from "@/components/ui";
import { useUnreadCount } from "@/hooks/social";
import { useTheme } from "@/theme/ThemeProvider";
import { fonts } from "@/theme/tokens";

const tabIcon =
  (name: FeatherName) =>
  ({ color, size }: { color: unknown; size: number }) => <Icon name={name} size={size - 2} color={color as string} />;

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const unread = useUnreadCount().data ?? 0;

  return (
    <Tabs
      screenListeners={{ tabPress: () => void Haptics.selectionAsync().catch(() => undefined) }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth * 2,
          height: (Platform.OS === "ios" ? 52 : 58) + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        tabBarBadgeStyle: {
          backgroundColor: colors.destructive,
          color: colors.destructiveForeground,
          fontFamily: fonts.bold,
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: tabIcon("home") }} />
      <Tabs.Screen name="library" options={{ title: "Library", tabBarIcon: tabIcon("book-open") }} />
      <Tabs.Screen name="search" options={{ title: "Explore", tabBarIcon: tabIcon("search") }} />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarIcon: tabIcon("bell"),
          tabBarBadge: unread > 0 ? (unread > 99 ? "99+" : unread) : undefined,
        }}
      />
      <Tabs.Screen name="me" options={{ title: "Me", tabBarIcon: tabIcon("user") }} />
    </Tabs>
  );
}
