import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { MAX_CONTENT_WIDTH } from "@/theme/tokens";

/**
 * Root container for a screen: themed background, safe-area padding, and a
 * centred max-width column so the same layout reads well on a tablet.
 *
 * Under a native stack/tab header, pass `edges={[]}`-style overrides — the
 * header already consumes the top inset.
 */
export function Screen({
  children,
  edges = ["top"],
  style,
  constrain = true,
}: {
  children: React.ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  constrain?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={edges} style={[styles.fill, { backgroundColor: colors.background }]}>
      <View style={[styles.fill, constrain && styles.column, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  column: { width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
});
