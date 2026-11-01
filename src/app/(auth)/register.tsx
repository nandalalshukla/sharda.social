import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Pressable, View } from "react-native";
import * as authApi from "@/api/auth";
import { getApiError } from "@/api/errors";
import { AuthShell } from "@/components/forms/AuthShell";
import { FormInput } from "@/components/forms/FormInput";
import { Button, Icon, Text } from "@/components/ui";
import { RegisterValues, passwordRules, registerSchema } from "@/lib/validation";
import { useTheme } from "@/theme/ThemeProvider";

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, formState, setError } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", username: "", email: "", password: "", confirmPassword: "" },
  });
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await authApi.register(values);
      // Registration emails a 6-digit code; verifying it also signs the user in.
      router.replace({ pathname: "/verify-email", params: { email: values.email.trim().toLowerCase() } });
    } catch (e) {
      const err = getApiError(e);
      // Pin server-side field errors (e.g. "username already in use") to their field.
      const fields = err.fieldErrors ?? {};
      let pinned = false;
      for (const [field, message] of Object.entries(fields)) {
        if (field in values) {
          setError(field as keyof RegisterValues, { message: String(message) });
          pinned = true;
        }
      }
      if (!pinned) setFormError(err.message);
    }
  });

  return (
    <AuthShell
      title="Join Sharda Social"
      subtitle="Notes, past papers and your campus community â€” in one place."
      error={formError}
      footer={
        <Pressable onPress={() => router.replace("/login")} hitSlop={8} accessibilityRole="link">
          <Text tone="muted">
            Already have an account?{" "}
            <Text tone="primary" weight="bold">
              Sign in
            </Text>
          </Text>
        </Pressable>
      }
    >
      <FormInput control={control} name="name" label="Full name" icon="user" placeholder="Your name" autoCapitalize="words" autoComplete="name" textContentType="name" />
      <FormInput
        control={control}
        name="username"
        label="Username"
        icon="at-sign"
        placeholder="e.g. rahul.sharma"
        autoCapitalize="none"
        autoCorrect={false}
        hint="Lowercase letters, numbers, dots and underscores"
        transform={(t) => t.toLowerCase()}
      />
      <FormInput
        control={control}
        name="email"
        label="Student email"
        icon="mail"
        placeholder="you@ug.sharda.ac.in"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
      />
      <FormInput control={control} name="password" label="Password" icon="lock" placeholder="Create a password" secure autoCapitalize="none" textContentType="newPassword" />

      {password.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: -6 }}>
          {passwordRules.map((rule) => {
            const ok = rule.test(password);
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
        name="confirmPassword"
        label="Confirm password"
        icon="lock"
        placeholder="Re-enter your password"
        secure
        autoCapitalize="none"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={() => onSubmit()}
      />

      <Button title="Create account" onPress={onSubmit} loading={formState.isSubmitting} fullWidth size="lg" />
    </AuthShell>
  );
}
