import React from "react";
import { Text as RNText, TextProps as RNTextProps, TextStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { FontWeight, fonts } from "@/theme/tokens";

export type TextTone =
  | "default"
  | "muted"
  | "primary"
  | "destructive"
  | "success"
  | "warning"
  | "inverse";

export type TextVariant =
  | "display"
  | "title"
  | "heading"
  | "subheading"
  | "body"
  | "small"
  | "caption";

const VARIANTS: Record<TextVariant, { size: number; line: number; weight: FontWeight; tracking?: number }> = {
  display: { size: 32, line: 38, weight: "black", tracking: -0.8 },
  title: { size: 24, line: 30, weight: "black", tracking: -0.5 },
  heading: { size: 19, line: 25, weight: "bold", tracking: -0.2 },
  subheading: { size: 16, line: 22, weight: "semibold" },
  body: { size: 15, line: 22, weight: "regular" },
  small: { size: 13, line: 18, weight: "regular" },
  caption: { size: 11.5, line: 15, weight: "semibold", tracking: 0.3 },
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  weight?: FontWeight;
  align?: TextStyle["textAlign"];
  /** Override tone with an exact colour (accent foregrounds, etc). */
  color?: string;
}

export function Text({
  variant = "body",
  tone = "default",
  weight,
  align,
  color,
  style,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  const v = VARIANTS[variant];
  const toneColor = {
    default: colors.foreground,
    muted: colors.mutedForeground,
    primary: colors.primary,
    destructive: colors.destructive,
    success: colors.success,
    warning: colors.warning,
    inverse: colors.primaryForeground,
  }[tone];

  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: fonts[weight ?? v.weight],
          fontSize: v.size,
          lineHeight: v.line,
          letterSpacing: v.tracking,
          color: color ?? toneColor,
          textAlign: align,
        },
        style,
      ]}
    />
  );
}
