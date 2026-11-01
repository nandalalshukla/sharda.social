import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { z } from "zod";
import * as authApi from "@/api/auth";
import { getApiError } from "@/api/errors";
import { FormInput } from "@/components/forms/FormInput";
import { Button, Card, Icon, Text } from "@/components/ui";
import { modRequestSchema } from "@/lib/validation";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/theme/ThemeProvider";
import { MAX_CONTENT_WIDTH, radius } from "@/theme/tokens";

type Values = z.infer<typeof modRequestSchema>;

export default function RequestModScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(modRequestSchema),
    defaultValues: { contactNo: user?.contactNo ?? "", motivation: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await authApi.requestModRole(values);
      setSent(true);
    } catch (e) {
      setError(getApiError(e).message);
    }
  });

  if (sent) {
    return (
      <View style={[styles.done, { backgroundColor: colors.background }]}>
        <View style={[styles.doneIcon, { backgroundColor: `${colors.success}22` }]}>
          <Icon name="check" size={34} color={colors.success} />
        </View>
        <Text variant="title" align="center">
          Request sent
        </Text>
        <Text tone="muted" align="center" style={{ maxWidth: 320 }}>
          An admin will review your request and email you the outcome. Thanks for wanting to help.
        </Text>
        <Button title="Done" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Card style={{ gap: 6 }} lift={0}>
          <Text weight="bold">What moderators do</Text>
          <Text variant="small" tone="muted">
            Moderators review uploaded notes, papers and syllabus, approve campus events and announcements, and handle reports so the library
            and feed stay accurate and kind.
          </Text>
        </Card>

        <FormInput control={control} name="contactNo" label="Contact number" icon="phone" keyboardType="phone-pad" maxChars={10} placeholder="10-digit mobile number" transform={(t) => t.replace(/\D/g, "")} />
        <FormInput
          control={control}
          name="motivation"
          label="Why would you like to be a moderator?"
          multiline
          maxChars={1000}
          placeholder="Tell us about your experience and what you'd bring (at least 20 characters)"
        />

        {error ? (
          <View style={[styles.error, { backgroundColor: `${colors.destructive}18`, borderColor: `${colors.destructive}55` }]} accessibilityLiveRegion="assertive">
            <Icon name="alert-circle" size={18} color={colors.destructive} />
            <Text variant="small" tone="destructive" weight="semibold" style={{ flex: 1 }}>
              {error}
            </Text>
          </View>
        ) : null}

        <Button title="Send request" onPress={onSubmit} loading={formState.isSubmitting} fullWidth size="lg" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 40, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
  error: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.lg, borderWidth: 1 },
  done: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 28 },
  doneIcon: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center" },
});
