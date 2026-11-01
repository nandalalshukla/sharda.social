import React, { forwardRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, TextInputInstance, TextInputProps, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { fonts, radius } from "@/theme/tokens";
import { FeatherName, Icon } from "./Icon";
import { Text } from "./Text";

export interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: FeatherName;
  /** Shows a show/hide eye and hides the text. */
  secure?: boolean;
  /** Character counter against this limit (multiline fields). */
  maxChars?: number;
}

export const Input = forwardRef<TextInputInstance, InputProps>(function Input(
  { label, error, hint, icon, secure, maxChars, multiline, value, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderColor = error ? colors.destructive : focused ? colors.primary : colors.border;

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="small" weight="semibold" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.card,
            borderColor,
            minHeight: multiline ? 104 : 48,
            alignItems: multiline ? "flex-start" : "center",
          },
          focused && { borderWidth: 1.5 },
        ]}
      >
        {icon ? (
          <View style={multiline ? styles.iconTop : undefined}>
            <Icon name={icon} size={18} color={focused ? colors.primary : colors.mutedForeground} />
          </View>
        ) : null}

        <TextInput
          ref={ref}
          value={value}
          multiline={multiline}
          maxLength={maxChars}
          secureTextEntry={secure && !revealed}
          placeholderTextColor={colors.mutedForeground}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
          style={[
            styles.input,
            { color: colors.foreground, fontFamily: fonts.regular },
            multiline && { textAlignVertical: "top", paddingTop: 12, minHeight: 88 },
          ]}
        />

        {secure ? (
          <Pressable
            hitSlop={12}
            onPress={() => setRevealed((r) => !r)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
          >
            <Icon name={revealed ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text variant="small" tone="destructive" style={styles.below}>
          {error}
        </Text>
      ) : hint || maxChars ? (
        <View style={[styles.below, styles.footer]}>
          <Text variant="small" tone="muted" style={{ flex: 1 }}>
            {hint ?? ""}
          </Text>
          {maxChars ? (
            <Text variant="small" tone="muted">
              {(value ?? "").length}/{maxChars}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { marginLeft: 2 },
  field: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
  },
  iconTop: { paddingTop: 15 },
  input: { flex: 1, fontSize: 15, paddingVertical: 10 },
  below: { marginLeft: 2 },
  footer: { flexDirection: "row", alignItems: "center" },
});
