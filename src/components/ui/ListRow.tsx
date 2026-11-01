import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/tokens";
import { FeatherName, Icon } from "./Icon";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";

export function ListRow({
  icon,
  label,
  description,
  value,
  onPress,
  destructive,
  accent,
  right,
  hideChevron,
}: {
  icon: FeatherName;
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  /** Tints the icon tile with one of the accent colours. */
  accent?: "primary" | "coral" | "mint" | "purple" | "sky";
  right?: React.ReactNode;
  hideChevron?: boolean;
}) {
  const { colors } = useTheme();
  const tint = destructive ? colors.destructive : accent ? colors[accent] : colors.primary;

  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.985}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      style={styles.row}
    >
      <View style={[styles.tile, { backgroundColor: `${tint}24` }]}>
        <Icon name={icon} size={19} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text weight="semibold" tone={destructive ? "destructive" : "default"}>
          {label}
        </Text>
        {description ? (
          <Text variant="small" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="small" tone="muted">
          {value}
        </Text>
      ) : null}
      {right}
      {onPress && !hideChevron && !right ? <Icon name="chevron-right" size={18} color={colors.mutedForeground} /> : null}
    </PressableScale>
  );
}

/** A titled, rounded group of rows with hairline dividers. */
export function ListGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={{ gap: 8 }}>
      {title ? (
        <Text variant="caption" tone="muted" style={styles.groupTitle}>
          {title.toUpperCase()}
        </Text>
      ) : null}
      <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {items.map((child, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
            {child}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 56 },
  tile: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  group: { borderRadius: radius.xl, borderWidth: 1, overflow: "hidden" },
  groupTitle: { marginLeft: 6, letterSpacing: 0.8 },
  divider: { height: StyleSheet.hairlineWidth * 2, marginLeft: 62 },
});
