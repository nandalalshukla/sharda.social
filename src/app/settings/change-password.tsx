import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { z } from "zod";
import * as authApi from "@/api/auth";
import { getApiError } from "@/api/errors";
import { FormInput } from "@/components/forms/FormInput";
import { Button, Icon, Text, toast } from "@/components/ui";
import { changePasswordSchema, passwordRules } from "@/lib/validation";
import { useTheme } from "@/theme/ThemeProvider";
import { MAX_CONTENT_WIDTH, radius } from "@/theme/tokens";

type Values = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });
  const next = useWatch({ control, name: "newPassword" });

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setError(null);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      router.back();
      setTimeout(() => toast.success("Password changed. Other devices were signed out."), 250);
    } catch (e) {
      setError(getApiError(e).message);
    }
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text tone="muted">Changing your password signs you out of every other device.</Text>

        <FormInput control={control} name="currentPassword" label="Current password" icon="lock" secure autoCapitalize="none" textContentType="password" />
        <FormInput control={control} name="newPassword" label="New password" icon="key" secure autoCapitalize="none" textContentType="newPassword" />

        {next.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: -6 }}>
            {passwordRules.map((rule) => {
              const ok = rule.test(next);
              return (
                <View key={rule.label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Icon name={ok ? "check-circle" : "circle"} size={13} color={ok ? colors.success : colors.mutedForeground} />
                  <Text variant="caption" color={ok ? colors.success : colors.mutedForeground}>
                    {rule.label}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        <FormInput
          control={control}
          name="confirmNewPassword"
          label="Confirm new password"
          icon="key"
          secure
          autoCapitalize="none"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => onSubmit()}
        />

        {error ? (
          <View style={[styles.error, { backgroundColor: `${colors.destructive}18`, borderColor: `${colors.destructive}55` }]} accessibilityLiveRegion="assertive">
            <Icon name="alert-circle" size={18} color={colors.destructive} />
            <Text variant="small" tone="destructive" weight="semibold" style={{ flex: 1 }}>
              {error}
            </Text>
          </View>
        ) : null}

        <Button title="Update password" onPress={onSubmit} loading={formState.isSubmitting} fullWidth size="lg" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 40, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
  error: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.lg, borderWidth: 1 },
});
