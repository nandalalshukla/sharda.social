import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import * as authApi from "@/api/auth";
import { getApiError } from "@/api/errors";
import { AuthShell } from "@/components/forms/AuthShell";
import { FormInput } from "@/components/forms/FormInput";
import { Button } from "@/components/ui";
import { forgotSchema } from "@/lib/validation";

type Values = z.infer<typeof forgotSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null);
    try {
      await authApi.forgotPassword({ email });
      router.push({ pathname: "/reset-password", params: { email } });
    } catch (e) {
      setFormError(getApiError(e).message);
    }
  });

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your student email and we'll send you a code to set a new one."
      error={formError}
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
        returnKeyType="send"
        onSubmitEditing={() => onSubmit()}
      />
      <Button title="Send code" onPress={onSubmit} loading={formState.isSubmitting} fullWidth size="lg" />
    </AuthShell>
  );
}
