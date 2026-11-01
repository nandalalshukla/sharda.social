import React from "react";
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { elevation, radius } from "@/theme/tokens";
import { FeatherName, Icon } from "./Icon";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "soft";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  title?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: FeatherName;
  iconRight?: FeatherName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const HEIGHT = { sm: 36, md: 46, lg: 54 } as const;
const PAD = { sm: 14, md: 20, lg: 24 } as const;

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const { colors } = useTheme();
  const inactive = disabled || loading;

  const palette = {
    primary: { bg: colors.primary, fg: colors.primaryForeground, border: "transparent" },
    secondary: { bg: colors.secondary, fg: colors.foreground, border: "transparent" },
    soft: { bg: colors.primarySoft, fg: colors.primary, border: "transparent" },
    outline: { bg: "transparent", fg: colors.foreground, border: colors.border },
    ghost: { bg: "transparent", fg: colors.mutedForeground, border: "transparent" },
    destructive: { bg: colors.destructive, fg: colors.destructiveForeground, border: "transparent" },
  }[variant];

  const iconSize = size === "sm" ? 16 : 18;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      haptic={variant === "primary" || variant === "destructive"}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.base,
        {
          height: HEIGHT[size],
          paddingHorizontal: title ? PAD[size] : 0,
          width: title ? undefined : HEIGHT[size],
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: palette.border === "transparent" ? 0 : 1.5,
          opacity: inactive && !loading ? 0.5 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        variant === "primary" && elevation(2, colors.primary),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Icon name={icon} size={iconSize} color={palette.fg} />}
          {title ? (
            <Text
              variant={size === "sm" ? "small" : "body"}
              weight="bold"
              color={palette.fg}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : null}
          {iconRight && <Icon name={iconRight} size={iconSize} color={palette.fg} />}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
