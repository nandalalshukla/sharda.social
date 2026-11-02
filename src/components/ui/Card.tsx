import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { elevation, radius } from "@/theme/tokens";
import { PressableScale } from "./PressableScale";

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  /** 0 = flat bordered, 1–3 = soft shadow. */
  lift?: 0 | 1 | 2 | 3;
  accessibilityLabel?: string;
}

export function Card({ children, onPress, style, padded = true, lift = 0, accessibilityLabel }: CardProps) {
  const { colors } = useTheme();
  const body: StyleProp<ViewStyle> = [
    styles.base,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
      padding: padded ? 16 : 0,
    },
    elevation(lift, colors.shadow),
    style,
  ];

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        scaleTo={0.985}
        style={body}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </PressableScale>
    );
  }
  return <View style={body}>{children}</View>;
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth * 2 },
});
