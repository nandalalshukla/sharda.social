import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";
import { Button } from "./Button";
import { FeatherName, Icon } from "./Icon";
import { Text } from "./Text";

export function EmptyState({
  icon = "inbox",
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: FeatherName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(380)} style={styles.wrap}>
      <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
        <Icon name={icon} size={30} color={colors.primary} />
      </View>
      <Text variant="heading" align="center">
        {title}
      </Text>
      {description ? (
        <Text tone="muted" align="center" style={styles.desc}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: 6 }}>
          <Button title={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </Animated.View>
  );
}

/** A failed load, with a way back. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="alert-circle"
      title="Something went wrong"
      description={message}
      actionLabel={onRetry ? "Try again" : undefined}
      onAction={onRetry}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 10, paddingVertical: 48, paddingHorizontal: 28 },
  badge: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  desc: { maxWidth: 320 },
});
