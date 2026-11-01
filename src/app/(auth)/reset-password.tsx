import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import * as authApi from "@/api/auth";
import { getApiError } from "@/api/errors";
import { AuthShell } from "@/components/forms/AuthShell";
import { FormInput } from "@/components/forms/FormInput";
import { OtpInput } from "@/components/forms/OtpInput";
import { Button, Text, toast } from "@/components/ui";
import { resetSchema } from "@/lib/validation";

type Values = z.infer<typeof resetSchema>;

export default function ResetPasswordScreen() {
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(resetSchema),
    defaultValues: { otp: "", newPassword: "", confirmNewPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await authApi.resetPassword({ email, ...values });
      toast.success("Password updated. Sign in with your new password.");
      router.dismissTo("/login");
    } catch (e) {
      setFormError(getApiError(e).message);
    }
  });

  return (
    <AuthShell
      title="Set a new password"
      subtitle={`Enter the code we sent to ${email || "your email"} and choose a new password.`}
      error={formError}
    >
      <Controller
        control={control}
        name="otp"
        render={({ field, fieldState }) => (
          <OtpInput value={field.value} onChange={field.onChange} error={fieldState.error?.message} autoFocus />
        )}
      />
      <Text variant="small" tone="muted" align="center" style={{ marginTop: -6 }}>
        Didn&apos;t get a code? Go back and request another.
      </Text>
      <FormInput control={control} name="newPassword" label="New password" icon="lock" placeholder="Create a new password" secure autoCapitalize="none" textContentType="newPassword" />
      <FormInput
        control={control}
        name="confirmNewPassword"
        label="Confirm new password"
        icon="lock"
        placeholder="Re-enter it"
        secure
        autoCapitalize="none"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={() => onSubmit()}
      />
      <Button title="Update password" onPress={onSubmit} loading={formState.isSubmitting} fullWidth size="lg" />
    </AuthShell>
  );
}
