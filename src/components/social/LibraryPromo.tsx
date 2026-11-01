import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";
import { PressableScale, Text, Icon } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/tokens";

/**
 * Slotted into the feed once, after the third post — the way the website's
 * InFeedLibraryPromo does — so the library is one tap away from the social side.
 */
export function LibraryPromo() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const chips = [
    { kind: "pyqs", label: "PYQs", bg: colors.coral, fg: colors.coralForeground },
    { kind: "notes", label: "Notes", bg: colors.mint, fg: colors.mintForeground },
    { kind: "syllabus", label: "Syllabus", bg: colors.purple, fg: colors.purpleForeground },
  ] as const;

  return (
    <LinearGradient
      colors={isDark ? ["#26215a", "#191726"] : ["#e8eaff", "#fff1e8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.box, { borderColor: colors.border }]}
    >
      <View style={styles.head}>
        <Icon name="book-open" size={18} color={colors.primary} />
        <Text variant="subheading">Exam coming up?</Text>
      </View>
      <Text variant="small" tone="muted">
        Free previous year papers, semester notes and syllabus for every Sharda school.
      </Text>
      <View style={styles.chips}>
        {chips.map((c) => (
          <PressableScale
            key={c.kind}
            onPress={() => router.push({ pathname: "/library/[kind]", params: { kind: c.kind } })}
            style={[styles.chip, { backgroundColor: c.bg }]}
            accessibilityRole="button"
            accessibilityLabel={`Browse ${c.label}`}
          >
            <Text weight="bold" variant="small" color={c.fg}>
              {c.label}
            </Text>
          </PressableScale>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.xl, padding: 16, gap: 8, borderWidth: StyleSheet.hairlineWidth * 2 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  chips: { flexDirection: "row", gap: 8, marginTop: 6 },
  chip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: radius.pill },
});
