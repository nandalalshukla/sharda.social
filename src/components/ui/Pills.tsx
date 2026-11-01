import * as Haptics from "expo-haptics";
import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { AccentName } from "@/theme/colors";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/tokens";
import { FeatherName, Icon } from "./Icon";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";

export interface PillItem<T extends string> {
  value: T;
  label: string;
  icon?: FeatherName;
  /** Small count shown after the label. */
  count?: number;
}

/**
 * Horizontally scrolling choice pills — the app's section switcher, mirroring
 * the website's feed tabs and filter chips.
 */
export function Pills<T extends string>({
  items,
  value,
  onChange,
  accent = "primary",
  small,
}: {
  items: PillItem<T>[];
  value: T;
  onChange: (value: T) => void;
  accent?: AccentName;
  small?: boolean;
}) {
  const { colors } = useTheme();
  const active = accent === "primary" ? colors.primary : colors[accent];
  const onActive =
    accent === "primary" ? colors.primaryForeground : colors[`${accent}Foreground` as const];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <PressableScale
            key={item.value}
            scaleTo={0.94}
            onPress={() => {
              if (selected) return;
              Haptics.selectionAsync().catch(() => undefined);
              onChange(item.value);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[
              styles.pill,
              small && styles.small,
              selected
                ? { backgroundColor: active, borderColor: active }
                : { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {item.icon ? (
              <Icon name={item.icon} size={small ? 13 : 15} color={selected ? onActive : colors.mutedForeground} />
            ) : null}
            <Text
              variant={small ? "caption" : "small"}
              weight="semibold"
              color={selected ? onActive : colors.mutedForeground}
            >
              {item.label}
            </Text>
            {item.count !== undefined ? (
              <Text variant="caption" color={selected ? onActive : colors.mutedForeground} style={{ opacity: 0.8 }}>
                {item.count}
              </Text>
            ) : null}
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  small: { height: 32, paddingHorizontal: 12 },
});
