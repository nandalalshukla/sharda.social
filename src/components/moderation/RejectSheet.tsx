import React, { useEffect, useState } from "react";
import { Button, Input, Sheet, Text } from "@/components/ui";

/**
 * Collects the reason shown to whoever's work is being turned down. The
 * backend requires 5–500 characters, so the button waits for that.
 */
export function RejectSheet({
  visible,
  title,
  onClose,
  onConfirm,
  loading,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!visible) setReason("");
  }, [visible]);

  const trimmed = reason.trim();
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={title}
      footer={<Button title="Reject" variant="destructive" size="lg" fullWidth disabled={trimmed.length < 5} loading={loading} onPress={() => onConfirm(trimmed)} />}
    >
      <Text tone="muted">They&apos;ll see this reason, so keep it clear and kind.</Text>
      <Input
        label="Reason"
        value={reason}
        onChangeText={setReason}
        multiline
        maxChars={500}
        placeholder="e.g. The file is a duplicate of an existing paper"
        hint={trimmed.length > 0 && trimmed.length < 5 ? "At least 5 characters" : undefined}
        autoFocus
      />
    </Sheet>
  );
}
