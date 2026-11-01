import { Platform, ViewStyle } from "react-native";

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
} as const;

/** Matches the website's radius scale (0.5rem … 1.75rem). */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 28,
  pill: 999,
} as const;

export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  black: "Inter_800ExtraBold",
} as const;

export type FontWeight = keyof typeof fonts;

/**
 * Soft elevation scale, the native counterpart of the site's `shadow-soft-*`.
 * iOS uses shadow props; Android uses `elevation`, which can't be tinted, so
 * the values are kept small enough to read as a gentle lift, not a slab.
 */
export const elevation = (level: 0 | 1 | 2 | 3, color = "#0f0f14"): ViewStyle => {
  if (level === 0) return {};
  const ios = {
    1: { opacity: 0.06, radius: 3, offset: 1 },
    2: { opacity: 0.08, radius: 10, offset: 4 },
    3: { opacity: 0.12, radius: 22, offset: 10 },
  }[level];
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: color,
      shadowOpacity: ios.opacity,
      shadowRadius: ios.radius,
      shadowOffset: { width: 0, height: ios.offset },
    },
    default: { elevation: level * 2 },
  })!;
};

/** Content never stretches wider than this, so tablets read like a phone column. */
export const MAX_CONTENT_WIDTH = 640;
