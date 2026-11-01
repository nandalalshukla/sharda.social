import React from "react";
import { StyleSheet, View } from "react-native";
import { AccentName } from "@/theme/colors";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/tokens";
import { FeatherName, Icon } from "./Icon";
import { Text } from "./Text";

export type BadgeVariant =
  | AccentName
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "neutral";

export function Badge({
  label,
  variant = "neutral",
  icon,
}: {
  label: string;
  variant?: BadgeVariant;
  icon?: FeatherName;
}) {
  const { colors } = useTheme();

  // Accent chips are a tint of the accent with the readable foreground on
  // top; status chips use the status colour on a soft wash of itself.
  const scheme = {
    neutral: { bg: colors.secondary, fg: colors.mutedForeground },
    primary: { bg: colors.primarySoft, fg: colors.primary },
    coral: { bg: `${colors.coral}38`, fg: colors.coral },
    mint: { bg: `${colors.mint}30`, fg: colors.mint },
    purple: { bg: `${colors.purple}30`, fg: colors.purple },
    sky: { bg: `${colors.sky}30`, fg: colors.sky },
    success: { bg: `${colors.success}22`, fg: colors.success },
    warning: { bg: `${colors.warning}24`, fg: colors.warning },
    destructive: { bg: `${colors.destructive}20`, fg: colors.destructive },
    info: { bg: `${colors.info}22`, fg: colors.info },
  }[variant];

  return (
    <View style={[styles.base, { backgroundColor: scheme.bg }]}>
      {icon ? <Icon name={icon} size={12} color={scheme.fg} /> : null}
      <Text variant="caption" color={scheme.fg} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
});
