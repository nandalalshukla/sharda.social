import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "./Text";

/** Title row at the top of a tab's root screen. */
export function TabHeader({
  title,
  subtitle,
  right,
  logo = false,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  /** Shows the app mark beside the title (the home tab). */
  logo?: boolean;
}) {
  return (
    <View style={styles.row}>
      {logo ? <Image source={require("../../../assets/logo.png")} style={styles.logo} contentFit="contain" accessibilityIgnoresInvertColors /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant={logo ? "heading" : "title"} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" tone="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, gap: 10, minHeight: 56 },
  logo: { width: 34, height: 34 },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
});
