import React, { useState } from "react";
import { View } from "react-native";
import { getApiError } from "@/api/errors";
import { createReport } from "@/api/social";
import type { ReportReason, ReportTargetType } from "@/api/types";
import { Button, Input, PressableScale, Sheet, Text, Icon, toast } from "@/components/ui";
import { REPORT_REASONS } from "@/constants/postMeta";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/tokens";

export interface ReportTarget {
  type: ReportTargetType;
  id: string;
  label: string;
}

/** Report a post, comment or user. Rate-limited server-side, so errors are shown as-is. */
export function ReportSheet({ target, onClose }: { target: ReportTarget | null; onClose: () => void }) {
  const { colors } = useTheme();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setReason(null);
    setMessage("");
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!target || !reason) return;
    setBusy(true);
    setError(null);
    try {
      await createReport({ targetType: target.type, targetId: target.id, reason, message: message.trim() || undefined });
      toast.success("Thanks — our moderators will take a look.");
      close();
    } catch (e) {
      setError(getApiError(e).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      visible={Boolean(target)}
      onClose={close}
      title={target ? `Report ${target.label}` : "Report"}
      footer={<Button title="Submit report" onPress={submit} loading={busy} disabled={!reason} fullWidth variant="destructive" size="lg" />}
    >
      <Text tone="muted">Why are you reporting this? Reports are anonymous to the person you report.</Text>

      <View style={{ gap: 8 }}>
        {REPORT_REASONS.map((r) => {
          const selected = reason === r.value;
          return (
            <PressableScale
              key={r.value}
              onPress={() => setReason(r.value)}
              scaleTo={0.985}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: radius.lg,
                borderWidth: 1.5,
                borderColor: selected ? colors.destructive : colors.border,
                backgroundColor: selected ? `${colors.destructive}12` : colors.card,
              }}
            >
              <Icon name={selected ? "check-circle" : "circle"} size={20} color={selected ? colors.destructive : colors.mutedForeground} />
              <Text weight={selected ? "semibold" : "regular"}>{r.label}</Text>
            </PressableScale>
          );
        })}
      </View>

      <Input
        label="Anything else? (optional)"
        value={message}
        onChangeText={setMessage}
        multiline
        maxChars={500}
        placeholder="Add context for the moderators"
      />

      {error ? (
        <Text variant="small" tone="destructive" weight="semibold">
          {error}
        </Text>
      ) : null}
    </Sheet>
  );
}
