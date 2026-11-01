import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, View } from "react-native";
import { z } from "zod";
import * as authApi from "@/api/auth";
import { getApiError } from "@/api/errors";
import { FormInput } from "@/components/forms/FormInput";
import { Avatar, Button, Icon, PressableScale, Select, Sheet, Text, toast } from "@/components/ui";
import { PROGRAM_OPTIONS } from "@/constants/programs";
import { editProfileSchema } from "@/lib/validation";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/theme/ThemeProvider";
import { MAX_CONTENT_WIDTH, radius } from "@/theme/tokens";
import { formatBytes, MAX_AVATAR_BYTES, PickedFile, pickProfilePhoto } from "@/utils/pickers";

type Values = z.infer<typeof editProfileSchema>;

export default function EditProfileScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [photo, setPhoto] = useState<PickedFile | null>(null);
  const [photoMenu, setPhotoMenu] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState({
    showEmail: user?.privacy?.showEmail ?? true,
    showContactNo: user?.privacy?.showContactNo ?? true,
    showCourse: user?.privacy?.showCourse ?? true,
  });

  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user?.name ?? "",
      bio: user?.bio ?? "",
      course: user?.course ?? "",
      contactNo: user?.contactNo ?? "",
    },
  });

  const pick = async (camera: boolean) => {
    setPhotoMenu(false);
    try {
      const picked = await pickProfilePhoto(camera);
      if (!picked) return;
      if ((picked.size ?? 0) > MAX_AVATAR_BYTES) {
        setError(`That photo is too large — the limit is ${formatBytes(MAX_AVATAR_BYTES)}.`);
        return;
      }
      setError(null);
      setPhoto(picked);
    } catch (e) {
      setError(getApiError(e).message);
    }
  };

  const removePhoto = async () => {
    setPhotoMenu(false);
    if (photo) {
      setPhoto(null);
      return;
    }
    setRemoving(true);
    try {
      setUser(await authApi.removeProfilePic());
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Photo removed");
    } catch (e) {
      setError(getApiError(e).message);
    } finally {
      setRemoving(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const updated = await authApi.updateProfile({
        name: values.name,
        bio: values.bio,
        course: values.course,
        contactNo: values.contactNo || undefined,
        profilePic: photo ?? undefined,
        ...privacy,
      });
      setUser(updated);
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      router.back();
      setTimeout(() => toast.success("Profile updated"), 250);
    } catch (e) {
      setError(getApiError(e).message);
    }
  });

  const hasPhoto = Boolean(photo || user?.profilePic?.url);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "center", gap: 10 }}>
          <PressableScale onPress={() => setPhotoMenu(true)} accessibilityRole="button" accessibilityLabel="Change profile photo">
            <Avatar uri={photo?.uri ?? user?.profilePic?.url} name={user?.name || user?.username} size={104} ring={colors.primary} />
            <View style={[styles.camera, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Icon name="camera" size={15} color={colors.primaryForeground} />
            </View>
          </PressableScale>
          <Text variant="small" tone="muted">
            {removing ? "Removing…" : photo ? "New photo selected — save to apply" : "Tap to change your photo"}
          </Text>
        </View>

        <FormInput control={control} name="name" label="Full name" icon="user" autoCapitalize="words" />
        <FormInput control={control} name="bio" label="Bio" multiline maxChars={500} placeholder="Tell people a little about yourself" />
        <Controller
          control={control}
          name="course"
          render={({ field, fieldState }) => (
            <Select
              label="Course / programme"
              value={field.value || null}
              options={field.value && !PROGRAM_OPTIONS.includes(field.value) ? [field.value, ...PROGRAM_OPTIONS] : PROGRAM_OPTIONS}
              onChange={(v) => field.onChange(v ?? "")}
              placeholder="Choose your programme"
              searchable
              clearable
              error={fieldState.error?.message}
            />
          )}
        />
        <FormInput control={control} name="contactNo" label="Contact number" icon="phone" keyboardType="phone-pad" maxChars={10} placeholder="10-digit mobile number" transform={(t) => t.replace(/\D/g, "")} />

        <View style={{ gap: 8 }}>
          <Text variant="caption" tone="muted" style={{ marginLeft: 6, letterSpacing: 0.8 }}>
            WHO CAN SEE
          </Text>
          <View style={[styles.privacy, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <PrivacyRow label="My email" value={privacy.showEmail} onChange={(v) => setPrivacy((p) => ({ ...p, showEmail: v }))} />
            <PrivacyRow label="My contact number" value={privacy.showContactNo} onChange={(v) => setPrivacy((p) => ({ ...p, showContactNo: v }))} />
            <PrivacyRow label="My course" value={privacy.showCourse} onChange={(v) => setPrivacy((p) => ({ ...p, showCourse: v }))} last />
          </View>
          <Text variant="small" tone="muted" style={{ marginLeft: 6 }}>
            Turned off means other students won&apos;t see it. You always see your own details.
          </Text>
        </View>

        {error ? (
          <View style={[styles.error, { backgroundColor: `${colors.destructive}18`, borderColor: `${colors.destructive}55` }]} accessibilityLiveRegion="assertive">
            <Icon name="alert-circle" size={18} color={colors.destructive} />
            <Text variant="small" tone="destructive" weight="semibold" style={{ flex: 1 }}>
              {error}
            </Text>
          </View>
        ) : null}

        <Button title="Save changes" onPress={onSubmit} loading={formState.isSubmitting} fullWidth size="lg" />
      </ScrollView>

      <Sheet visible={photoMenu} onClose={() => setPhotoMenu(false)} title="Profile photo">
        <Button title="Choose from library" icon="image" variant="secondary" fullWidth onPress={() => pick(false)} />
        <Button title="Take a photo" icon="camera" variant="secondary" fullWidth onPress={() => pick(true)} />
        {hasPhoto ? <Button title={photo ? "Discard new photo" : "Remove current photo"} icon="trash-2" variant="ghost" fullWidth onPress={removePhoto} /> : null}
      </Sheet>
    </KeyboardAvoidingView>
  );
}

function PrivacyRow({ label, value, onChange, last }: { label: string; value: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.privacyRow, !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth * 2 }]}>
      <Text weight="semibold" style={{ flex: 1 }}>
        {label}
      </Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.border }} accessibilityLabel={`Show ${label}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 18, paddingBottom: 40, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
  camera: { position: "absolute", right: 0, bottom: 0, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 3 },
  privacy: { borderRadius: radius.xl, borderWidth: 1, overflow: "hidden" },
  privacyRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10 },
  error: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.lg, borderWidth: 1 },
});
