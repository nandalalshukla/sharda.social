import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { Post } from "@/api/types";
import { Badge, FeatherName, Icon, Text } from "@/components/ui";
import { lostFoundKindMeta, resolveLostFoundCategory } from "@/constants/postMeta";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/tokens";
import { formatDate } from "@/utils/format";

/** Mods and admins carry a check, same as the website's VerifiedBadge. */
export function RoleBadge({ role }: { role?: string }) {
  const { colors } = useTheme();
  if (role !== "mod" && role !== "admin") return null;
  return (
    <View accessible accessibilityLabel={role === "admin" ? "Admin" : "Moderator"}>
      <Icon name="check-circle" size={14} color={role === "admin" ? colors.coral : colors.primary} />
    </View>
  );
}

/** Where an unpublished post stands — only its own author ever sees this. */
export function ModerationBanner({ post }: { post: Post }) {
  const { colors } = useTheme();
  const status = post.moderationStatus ?? "approved";
  if (status === "approved") return null;

  const rejected = status === "rejected";
  const tint = rejected ? colors.destructive : colors.warning;
  return (
    <View style={[styles.banner, { backgroundColor: `${tint}18`, borderColor: `${tint}55` }]}>
      <Icon name={rejected ? "x-circle" : "clock"} size={18} color={tint} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="small" weight="bold" color={tint}>
          {rejected ? "Not approved" : "Waiting for review"}
        </Text>
        <Text variant="small" tone="muted">
          {rejected
            ? post.rejectionReason || "A moderator didn't approve this post."
            : "Only you can see this until a moderator approves it."}
        </Text>
      </View>
    </View>
  );
}

export function LostFoundBlock({ post }: { post: Post }) {
  const { colors } = useTheme();
  const lf = post.lostFound;
  if (!lf) return null;

  const kind = lostFoundKindMeta[lf.kind];
  const category = resolveLostFoundCategory(lf.category);
  const resolved = lf.status === "resolved";

  const rows: { icon: FeatherName; label: string }[] = [];
  if (lf.location) rows.push({ icon: "map-pin", label: lf.location });
  if (lf.dateOccurred) rows.push({ icon: "calendar", label: formatDate(lf.dateOccurred) });
  if (lf.contactInfo) rows.push({ icon: "phone", label: lf.contactInfo });

  return (
    <View style={[styles.lf, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: resolved ? 0.75 : 1 }]}>
      <View style={styles.lfHead}>
        <View style={[styles.lfIcon, { backgroundColor: colors.primarySoft }]}>
          <Icon name={category.icon as never} size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="bold" numberOfLines={2}>
            {lf.itemName}
          </Text>
          <Text variant="small" tone="muted">
            {category.label}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Badge label={kind.label} variant={kind.badge} />
          {resolved ? <Badge label="Resolved" variant="success" icon="check" /> : null}
        </View>
      </View>
      {rows.map((r) => (
        <View key={r.label} style={styles.lfRow}>
          <Icon name={r.icon} size={14} color={colors.mutedForeground} />
          <Text variant="small" tone="muted" style={{ flex: 1 }} selectable>
            {r.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Instagram-style heart that pops up and fades after a double tap. */
export function HeartBurst({ trigger }: { trigger: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    scale.value = 0.3;
    opacity.value = 1;
    scale.value = withSequence(withSpring(1.15, { damping: 8 }), withDelay(250, withTiming(1.3, { duration: 200 })));
    opacity.value = withSequence(withTiming(1, { duration: 80 }), withDelay(420, withTiming(0, { duration: 260 })));
  }, [trigger, scale, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  return (
    <Animated.View pointerEvents="none" style={[styles.burst, style]}>
      <Icon name="heart" family="ion" size={84} color="#ff3b5c" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: "row", gap: 10, padding: 12, borderRadius: radius.lg, borderWidth: 1 },
  lf: { borderRadius: radius.lg, borderWidth: 1, padding: 14, gap: 8 },
  lfHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  lfIcon: { width: 38, height: 38, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  lfRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  burst: { position: "absolute", alignSelf: "center", top: "30%", zIndex: 5 },
});
