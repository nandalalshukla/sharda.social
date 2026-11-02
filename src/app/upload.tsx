import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { getApiError } from "@/api/errors";
import { updateResource, uploadResource } from "@/api/library";
import type { ResourceKind } from "@/api/types";
import { FormInput } from "@/components/forms/FormInput";
import { Button, Card, Icon, ModalHeader, Pills, ProgressBar, Select, Text, toast } from "@/components/ui";
import { academicYears, isResourceKind, KIND_META, KIND_ORDER, SEMESTERS } from "@/constants/library";
import { PROGRAM_OPTIONS } from "@/constants/programs";
import { useMyResources } from "@/hooks/library";
import { resourceSchema } from "@/lib/validation";
import { useTheme } from "@/theme/ThemeProvider";
import { MAX_CONTENT_WIDTH, radius } from "@/theme/tokens";
import { formatBytes, MAX_RESOURCE_BYTES, PickedFile, pickStudyFile } from "@/utils/pickers";

type Values = z.infer<typeof resourceSchema>;

const KIND_PILLS = KIND_ORDER.map((k) => ({ value: k, label: KIND_META[k].noun === "Paper" ? "Question paper" : KIND_META[k].noun, icon: KIND_META[k].icon }));

export default function UploadScreen() {
  const params = useLocalSearchParams<{ kind?: string; id?: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { colors } = useTheme();

  const editing = Boolean(params.id);
  const [kind, setKind] = useState<ResourceKind>(isResourceKind(params.kind) ? params.kind : "notes");
  const meta = KIND_META[kind];

  const mine = useMyResources(kind, editing);
  const existing = editing ? mine.data?.find((r) => r._id === params.id) : undefined;

  const [file, setFile] = useState<PickedFile | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState } = useForm<Values>({
    resolver: zodResolver(resourceSchema),
    defaultValues: { title: "", program: "", courseCode: "", courseName: "", semester: "", year: "" },
  });

  useEffect(() => {
    if (!existing) return;
    reset({
      title: existing.title,
      program: existing.program,
      courseCode: existing.courseCode,
      courseName: existing.courseName,
      semester: String(existing.semester),
      year: existing.year ?? "",
    });
  }, [existing, reset]);

  const close = () => {
    Keyboard.dismiss();
    router.back();
  };

  const chooseFile = async () => {
    try {
      const picked = await pickStudyFile();
      if (!picked) return;
      if ((picked.size ?? 0) > MAX_RESOURCE_BYTES) {
        setError(`That file is too large — the limit is ${formatBytes(MAX_RESOURCE_BYTES)}.`);
        return;
      }
      setError(null);
      setFile(picked);
    } catch (e) {
      setError(getApiError(e).message);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    if (!editing && !file) {
      setError("Choose a file to share.");
      return;
    }
    if (meta.hasYear && !values.year) {
      setError("Choose the academic year.");
      return;
    }

    const input = {
      title: values.title,
      program: values.program,
      courseCode: values.courseCode,
      courseName: values.courseName,
      semester: Number(values.semester),
      year: meta.hasYear ? values.year : undefined,
      file: file ?? undefined,
    };

    try {
      if (editing && params.id) await updateResource(kind, params.id, input, setProgress);
      else await uploadResource(kind, input, setProgress);

      qc.invalidateQueries({ queryKey: ["mine"] });
      close();
      setTimeout(() => toast.success(editing ? "Updated — it will be re-reviewed" : "Thanks! A moderator will review it shortly."), 350);
    } catch (e) {
      setError(getApiError(e).message);
    }
  });

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ModalHeader title={editing ? `Edit ${meta.noun.toLowerCase()}` : "Share study material"} onClose={close} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {!editing ? <Pills items={KIND_PILLS} value={kind} onChange={setKind} accent={meta.accent} /> : null}

          <View style={[styles.notice, { backgroundColor: colors.primarySoft }]}>
            <Icon name="shield" size={18} color={colors.primary} />
            <Text variant="small" style={{ flex: 1 }}>
              Uploads are reviewed by a moderator before they appear in the library. You&apos;ll be emailed once it&apos;s live.
            </Text>
          </View>

          <FormInput control={control} name="title" label="Title *" placeholder={meta.titleHint} maxChars={100} />

          <Controller
            control={control}
            name="program"
            render={({ field, fieldState }) => (
              <Select
                label="Programme *"
                value={field.value}
                options={PROGRAM_OPTIONS}
                onChange={(v) => field.onChange(v ?? "")}
                placeholder="Choose your programme"
                searchable
                error={fieldState.error?.message}
              />
            )}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormInput
                control={control}
                name="courseCode"
                label="Course code *"
                placeholder={meta.codePlaceholder}
                autoCapitalize="characters"
                autoCorrect={false}
                transform={(t) => t.toUpperCase()}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="semester"
                render={({ field, fieldState }) => (
                  <Select
                    label="Semester *"
                    value={field.value}
                    options={SEMESTERS.map((s) => ({ value: s, label: `Semester ${s}` }))}
                    onChange={(v) => field.onChange(v ?? "")}
                    placeholder="Choose"
                    error={fieldState.error?.message}
                  />
                )}
              />
            </View>
          </View>

          <FormInput control={control} name="courseName" label="Course name *" placeholder="e.g. Database Management Systems" maxChars={100} />

          {meta.hasYear ? (
            <Controller
              control={control}
              name="year"
              render={({ field, fieldState }) => (
                <Select
                  label="Academic year *"
                  value={field.value}
                  options={academicYears(10)}
                  onChange={(v) => field.onChange(v ?? "")}
                  placeholder="e.g. 2024-25"
                  error={fieldState.error?.message}
                />
              )}
            />
          ) : null}

          <View style={{ gap: 8 }}>
            <Text variant="small" weight="semibold" style={{ marginLeft: 2 }}>
              File {editing ? "(optional — keep the current one)" : "*"}
            </Text>
            <Card onPress={chooseFile} lift={0} style={[styles.drop, { borderColor: file ? colors.primary : colors.border }]} accessibilityLabel="Choose a file">
              <View style={[styles.dropIcon, { backgroundColor: colors.primarySoft }]}>
                <Icon name={file ? "file-text" : "upload-cloud"} size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text weight="semibold" numberOfLines={1}>
                  {file ? file.name : "Choose a PDF, Word, PowerPoint or image"}
                </Text>
                <Text variant="small" tone="muted">
                  {file ? formatBytes(file.size) : `Up to ${formatBytes(MAX_RESOURCE_BYTES)}`}
                </Text>
              </View>
              {file ? (
                <Pressable onPress={() => setFile(null)} hitSlop={10} accessibilityLabel="Remove file">
                  <Icon name="x-circle" size={20} color={colors.mutedForeground} />
                </Pressable>
              ) : null}
            </Card>
          </View>

          {error ? (
            <View style={[styles.notice, { backgroundColor: `${colors.destructive}18`, borderColor: `${colors.destructive}55`, borderWidth: 1 }]} accessibilityLiveRegion="assertive">
              <Icon name="alert-circle" size={18} color={colors.destructive} />
              <Text variant="small" tone="destructive" weight="semibold" style={{ flex: 1 }}>
                {error}
              </Text>
            </View>
          ) : null}

          {formState.isSubmitting && file ? <ProgressBar value={progress} label={`Uploading… ${Math.round(progress * 100)}%`} /> : null}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <Button title={editing ? "Save changes" : "Submit for review"} onPress={onSubmit} loading={formState.isSubmitting} fullWidth size="lg" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 32, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
  notice: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.lg },
  drop: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, borderStyle: "dashed" },
  dropIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth * 2 },
});
