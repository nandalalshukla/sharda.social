import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Badge, Card, Icon, Text } from "@/components/ui";
import { KIND_META } from "@/constants/library";
import type { LibraryEntry } from "@/hooks/library";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/tokens";
import { ordinal } from "@/utils/format";

export const ResourceCard = memo(function ResourceCard({
  entry,
  onPress,
}: {
  entry: LibraryEntry;
  onPress: (entry: LibraryEntry) => void;
}) {
  const { colors } = useTheme();
  const meta = KIND_META[entry.kind];
  const accent = colors[meta.accent];
  const accentFg = colors[`${meta.accent}Foreground` as const];
  const units = entry.files.length;

  return (
    <Card onPress={() => onPress(entry)} accessibilityLabel={`${entry.title}, ${entry.code}`} style={styles.card}>
      <View style={[styles.icon, { backgroundColor: accent }]}>
        <Icon name={meta.icon} size={22} color={accentFg} />
      </View>

      <View style={{ flex: 1, gap: 5 }}>
        <Text weight="bold" numberOfLines={2}>
          {entry.title}
        </Text>
        <View style={styles.meta}>
          {entry.code ? <Badge label={entry.code} variant={meta.accent} /> : null}
          <Text variant="small" tone="muted">
            {ordinal(entry.semester)} sem{entry.year ? ` · ${entry.year}` : ""}
          </Text>
        </View>
        {entry.program || units > 1 || entry.contributor ? (
          <Text variant="caption" tone="muted" weight="regular" numberOfLines={1}>
            {[entry.program, units > 1 ? `${units} units` : null, entry.contributor ? `by @${entry.contributor}` : null]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        ) : null}
      </View>

      <Icon name="chevron-right" size={20} color={colors.mutedForeground} />
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  icon: { width: 48, height: 48, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  meta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
});
