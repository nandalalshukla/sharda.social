import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable } from "react-native";
import * as authApi from "@/api/auth";
import { getApiError } from "@/api/errors";
import { AuthShell } from "@/components/forms/AuthShell";
import { OtpInput } from "@/components/forms/OtpInput";
import { Button, Text, toast } from "@/components/ui";
import { useAuthStore } from "@/stores/auth";

const RESEND_COOLDOWN = 45;

export default function VerifyEmailScreen() {
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);

  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = useCallback(
    async (code: string) => {
      if (busy) return;
      setBusy(true);
      setError(null);
      try {
        const session = await authApi.verifyEmail({ email, otp: code });
        await signIn(session);
        toast.success("Email verified — you're in!");
        router.dismissTo("/");
      } catch (e) {
        setError(getApiError(e).message);
        setOtp("");
      } finally {
        setBusy(false);
      }
    },
    [busy, email, router, signIn],
  );

  const resend = async () => {
    setError(null);
    try {
      await authApi.resendOtp({ email });
      setInfo("A new code is on its way.");
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      setError(getApiError(e).message);
    }
  };

  return (
    <AuthShell
      title="Check your email"
      subtitle={`We sent a 6-digit code to ${email || "your student email"}. It expires in a few minutes.`}
      error={error}
      footer={
        <>
          {info && !error ? (
            <Text variant="small" tone="success" weight="semibold">
              {info}
            </Text>
          ) : null}
          <Pressable onPress={resend} disabled={cooldown > 0} hitSlop={8} accessibilityRole="button">
            <Text tone="muted">
              Didn&apos;t get it?{" "}
              <Text tone={cooldown > 0 ? "muted" : "primary"} weight="bold">
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </Text>
            </Text>
          </Pressable>
        </>
      }
    >
      <OtpInput
        value={otp}
        autoFocus
        onChange={(v) => {
          setOtp(v);
          if (v.length === 6) verify(v);
        }}
      />
      <Button title="Verify email" onPress={() => verify(otp)} loading={busy} disabled={otp.length !== 6} fullWidth size="lg" />
    </AuthShell>
  );
}
