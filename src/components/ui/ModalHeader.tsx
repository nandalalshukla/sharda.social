import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Icon } from "./Icon";
import { Text } from "./Text";

/**
 * Header for full-screen forms presented as modals. Drawn in the screen rather
 * than by the navigator, so the close button is always there, looks the same
 * on both platforms, and doesn't depend on native header quirks.
 */
export function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Pressable
        onPress={onClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={[styles.close, { backgroundColor: colors.secondary }]}
      >
        <Icon name="x" size={20} />
      </Pressable>
      <Text variant="heading" numberOfLines={1} style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.close} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  close: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center" },
});
