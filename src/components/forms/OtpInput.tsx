import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, TextInputInstance, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { fonts, radius } from "@/theme/tokens";
import { Text } from "@/components/ui";

const LENGTH = 6;

/**
 * Six boxes driven by one hidden input, so the OS can autofill the code from
 * an SMS/clipboard suggestion and paste works, while still looking like
 * individual cells.
 */
export function OtpInput({
  value,
  onChange,
  error,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoFocus?: boolean;
}) {
  const { colors } = useTheme();
  const ref = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => ref.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  return (
    <View style={{ gap: 8 }}>
      <Pressable onPress={() => ref.current?.focus()} accessibilityLabel="Verification code" style={styles.row}>
        {Array.from({ length: LENGTH }).map((_, i) => {
          const char = value[i];
          const active = focused && i === Math.min(value.length, LENGTH - 1);
          return (
            <View
              key={i}
              style={[
                styles.cell,
                {
                  backgroundColor: colors.card,
                  borderColor: error ? colors.destructive : active ? colors.primary : colors.border,
                  borderWidth: active ? 2 : 1,
                },
              ]}
            >
              <Text style={styles.char}>{char ?? ""}</Text>
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={LENGTH}
        caretHidden
        style={styles.hidden}
      />

      {error ? (
        <Text variant="small" tone="destructive" align="center">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: 10 },
  cell: { width: 46, height: 56, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  char: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30 },
  hidden: { position: "absolute", opacity: 0, height: 1, width: 1 },
});
