import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable } from "react-native";
import * as authApi from "@/api/auth";
import { getApiError } from "@/api/errors";
import { AuthShell } from "@/components/forms/AuthShell";
import { FormInput } from "@/components/forms/FormInput";
import { Button, Text, toast } from "@/components/ui";
import { LoginValues, loginSchema } from "@/lib/validation";
import { useAuthStore } from "@/stores/auth";

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const session = await authApi.login(values);
      await signIn(session);
      toast.success(`Welcome back, ${session.user.name?.split(" ")[0] ?? "friend"}!`);
      router.dismissTo("/");
    } catch (e) {
      const err = getApiError(e);
      // The backend answers 403 + the user's id when the email isn't verified
      // yet (and has just sent a fresh code), so carry on to that step.
      if (err.status === 403 && (err.data as { userId?: string } | undefined)?.userId) {
        router.push({ pathname: "/verify-email", params: { email: values.email.trim().toLowerCase() } });
        return;
      }
      setFormError(err.message);
    }
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your Sharda student email to join the conversation."
      error={formError}
      footer={
        <Pressable onPress={() => router.push("/register")} hitSlop={8} accessibilityRole="link">
          <Text tone="muted">
            New to Sharda Social?{" "}
            <Text tone="primary" weight="bold">
              Create an account
            </Text>
          </Text>
        </Pressable>
      }
    >
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
        returnKeyType="next"
      />
      <FormInput
        control={control}
        name="password"
        label="Password"
        icon="lock"
        placeholder="Your password"
        secure
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => onSubmit()}
      />

      <Pressable onPress={() => router.push("/forgot-password")} hitSlop={8} style={{ alignSelf: "flex-end" }}>
        <Text variant="small" tone="primary" weight="semibold">
          Forgot password?
        </Text>
      </Pressable>

      <Button title="Sign in" onPress={onSubmit} loading={formState.isSubmitting} fullWidth size="lg" />
    </AuthShell>
  );
}
