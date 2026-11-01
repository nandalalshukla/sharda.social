/**
 * "Vibrant Campus" — the website's design tokens (app/globals.css), carried
 * over value for value so the app and the site read as one product.
 */
export interface Palette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;

  primary: string;
  primaryHover: string;
  primaryForeground: string;
  /** Primary at low opacity, for tinted chips and selected rows. */
  primarySoft: string;

  secondary: string;
  secondaryHover: string;
  muted: string;
  mutedForeground: string;

  border: string;
  input: string;

  coral: string;
  coralForeground: string;
  mint: string;
  mintForeground: string;
  purple: string;
  purpleForeground: string;
  sky: string;
  skyForeground: string;

  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  destructive: string;
  destructiveForeground: string;
  info: string;
  infoForeground: string;

  ink: string;
  overlay: string;
  shadow: string;
}

export const lightPalette: Palette = {
  background: "#faf9fd",
  foreground: "#15131f",
  card: "#ffffff",
  cardForeground: "#15131f",

  primary: "#6366f1",
  primaryHover: "#4f46e5",
  primaryForeground: "#ffffff",
  primarySoft: "rgba(99,102,241,0.10)",

  secondary: "#f1eff9",
  secondaryHover: "#e6e2f5",
  muted: "#f1eff9",
  mutedForeground: "#6b6478",

  border: "#e6e2f2",
  input: "#e6e2f2",

  coral: "#ff9f66",
  coralForeground: "#1a1207",
  mint: "#4ade80",
  mintForeground: "#062b13",
  purple: "#c084fc",
  purpleForeground: "#250a3a",
  sky: "#38bdf8",
  skyForeground: "#04222f",

  success: "#16a34a",
  successForeground: "#ffffff",
  warning: "#d97706",
  warningForeground: "#ffffff",
  destructive: "#e11d48",
  destructiveForeground: "#ffffff",
  info: "#3b82f6",
  infoForeground: "#ffffff",

  ink: "#15131f",
  overlay: "rgba(21,19,31,0.45)",
  shadow: "#0f0f14",
};

export const darkPalette: Palette = {
  background: "#100e1a",
  foreground: "#f1eefb",
  card: "#191726",
  cardForeground: "#f1eefb",

  primary: "#818cf8",
  primaryHover: "#a5b4fc",
  primaryForeground: "#100e1a",
  primarySoft: "rgba(129,140,248,0.16)",

  secondary: "#221e34",
  secondaryHover: "#2b2640",
  muted: "#1d1a2c",
  mutedForeground: "#a49cc4",

  border: "#2b2640",
  input: "#2b2640",

  coral: "#ffb488",
  coralForeground: "#1a1207",
  mint: "#6ee7a5",
  mintForeground: "#062b13",
  purple: "#d8acfd",
  purpleForeground: "#250a3a",
  sky: "#7dd3fc",
  skyForeground: "#04222f",

  success: "#4ade80",
  successForeground: "#062b13",
  warning: "#fbbf24",
  warningForeground: "#1a1207",
  destructive: "#fb7185",
  destructiveForeground: "#2a0510",
  info: "#60a5fa",
  infoForeground: "#04182f",

  ink: "#ece9f9",
  overlay: "rgba(0,0,0,0.62)",
  shadow: "#000000",
};

export type AccentName = "coral" | "mint" | "purple" | "sky" | "primary";
