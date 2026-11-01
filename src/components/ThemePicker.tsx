import React from "react";
import { StyleSheet, View } from "react-native";
import { FeatherName, Icon, PressableScale, Text } from "@/components/ui";
import { ThemePreference, useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/tokens";

const OPTIONS: { value: ThemePreference; label: string; icon: FeatherName }[] = [
  { value: "system", label: "System", icon: "smartphone" },
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
];

/** Segmented control for the light/dark preference, as the website's toggle. */
export function ThemePicker() {
  const { colors, preference, setPreference } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.secondary }]} accessibilityRole="radiogroup">
      {OPTIONS.map((o) => {
        const selected = preference === o.value;
        return (
          <PressableScale
            key={o.value}
            onPress={() => setPreference(o.value)}
            scaleTo={0.96}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${o.label} theme`}
            style={[styles.option, selected && { backgroundColor: colors.card }]}
          >
            <Icon name={o.icon} size={16} color={selected ? colors.primary : colors.mutedForeground} />
            <Text variant="small" weight="semibold" tone={selected ? "primary" : "muted"}>
              {o.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", padding: 4, borderRadius: radius.lg, gap: 4 },
  option: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 40, borderRadius: radius.md },
});
