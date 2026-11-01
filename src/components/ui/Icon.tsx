import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { useTheme } from "@/theme/ThemeProvider";

export type FeatherName = React.ComponentProps<typeof Feather>["name"];
export type IonName = React.ComponentProps<typeof Ionicons>["name"];

/** Icon fonts to preload at startup, so glyphs never pop in after first paint. */
export const iconFonts = { ...Feather.font, ...Ionicons.font };

type IconProps =
  | { name: FeatherName; family?: "feather"; size?: number; color?: string }
  | { name: IonName; family: "ion"; size?: number; color?: string };

/**
 * Feather matches the website's icon set (react-icons/fi). Ionicons is used
 * only where a filled glyph is needed — the like heart. Each family is
 * imported directly (not from the package root), so only these two fonts
 * ship in the app instead of all fifteen.
 */
export function Icon({ name, family = "feather", size = 20, color }: IconProps) {
  const { colors } = useTheme();
  const tint = color ?? colors.foreground;
  if (family === "ion") {
    return <Ionicons name={name as IonName} size={size} color={tint} />;
  }
  return <Feather name={name as FeatherName} size={size} color={tint} />;
}
