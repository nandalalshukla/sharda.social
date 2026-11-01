import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "./Text";

export interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  /** Ring colour, e.g. to mark a verified moderator. */
  ring?: string;
}

const ACCENTS = ["coral", "mint", "purple", "sky", "primary"] as const;

/** Stable hash so the same person always gets the same fallback colour. */
const pick = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return ACCENTS[Math.abs(h) % ACCENTS.length];
};

export function Avatar({ uri, name, size = 40, ring }: AvatarProps) {
  const { colors } = useTheme();
  const label = (name ?? "?").trim();
  const accent = pick(label || "?");
  const bg = colors[accent];
  const fg = accent === "primary" ? colors.primaryForeground : colors[`${accent}Foreground` as const];

  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        ring ? { borderWidth: 2, borderColor: ring } : null,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          recyclingKey={uri}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text weight="bold" color={fg} style={{ fontSize: size * 0.42, lineHeight: size * 0.52 }}>
          {label.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
});
