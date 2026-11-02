import { FlashList } from "@shopify/flash-list";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { getErrorMessage } from "@/api/errors";
import type { ResourceKind } from "@/api/types";
import { FilterOptions, FilterSheet } from "@/components/library/FilterSheet";
import { ResourceCard } from "@/components/library/ResourceCard";
import { ResourceSheet } from "@/components/library/ResourceSheet";
import { EmptyState, ErrorState, Icon, PressableScale, SkeletonList, Text } from "@/components/ui";
import { academicYears, isResourceKind, KIND_META, SEMESTERS } from "@/constants/library";
import { PROGRAM_OPTIONS } from "@/constants/programs";
import { EMPTY_FILTERS, hasActiveFilters, LibraryEntry, LibraryFilters, useLibrary, usePyqFilterOptions, usePyqs } from "@/hooks/library";
import { useDebounced } from "@/hooks/useDebounced";
import { useTheme } from "@/theme/ThemeProvider";
import { fonts, MAX_CONTENT_WIDTH, radius } from "@/theme/tokens";

export default function LibraryListScreen() {
  const params = useLocalSearchParams<{ kind: string; semester?: string }>();
  const kind: ResourceKind = isResourceKind(params.kind) ? params.kind : "pyqs";
  const meta = KIND_META[kind];
  const router = useRouter();
  const { colors } = useTheme();

  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState<LibraryFilters>({ ...EMPTY_FILTERS, semester: params.semester ?? null });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<LibraryEntry | null>(null);

  const debouncedSearch = useDebounced(search, 300);
  const filters = useMemo<LibraryFilters>(() => ({ ...applied, query: debouncedSearch }), [applied, debouncedSearch]);

  const isPyq = kind === "pyqs";
  // Hooks can't be conditional, so both are called; only the one for this kind is enabled.
  const pyqs = usePyqs(filters, isPyq);
  const library = useLibrary(isPyq ? "notes" : (kind as "notes" | "syllabus"), filters, !isPyq);
  const pyqOptions = usePyqFilterOptions();

  const entries = isPyq ? pyqs.entries : library.entries;
  const loading = isPyq ? pyqs.isLoading : library.isLoading;
  const isError = isPyq ? pyqs.isError && entries.length === 0 : library.isError && entries.length === 0;
  const errorObj = isPyq ? pyqs.error : null;
  const total = isPyq ? pyqs.total : entries.length;

  const options = useMemo<FilterOptions>(() => {
    if (isPyq && pyqOptions.data) {
      return {
        programs: pyqOptions.data.programs,
        years: pyqOptions.data.years,
        semesters: pyqOptions.data.semesters.map(String),
      };
    }
    return { programs: PROGRAM_OPTIONS, years: academicYears(8), semesters: SEMESTERS };
  }, [isPyq, pyqOptions.data]);

  const active = [applied.program, applied.semester, applied.year, applied.courseCode.trim()].filter(Boolean).length;
  const refetch = useCallback(() => {
    void (isPyq ? pyqs.refetch() : library.refetch());
  }, [isPyq, pyqs, library]);

  const clearChip = (key: keyof LibraryFilters) =>
    setApplied((f) => ({ ...f, [key]: key === "courseCode" ? "" : null }));

  const chips = [
    applied.program && { key: "program" as const, label: applied.program },
    applied.semester && { key: "semester" as const, label: `Sem ${applied.semester}` },
    applied.year && { key: "year" as const, label: applied.year },
    applied.courseCode.trim() && { key: "courseCode" as const, label: applied.courseCode.trim().toUpperCase() },
  ].filter(Boolean) as { key: keyof LibraryFilters; label: string }[];

  const accent = colors[meta.accent];

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: meta.title,
          headerRight: () => (
            <Pressable
              onPress={() => router.push({ pathname: "/upload", params: { kind } })}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Share a ${meta.noun.toLowerCase()}`}
            >
              <Icon name="upload-cloud" size={22} color={colors.primary} />
            </Pressable>
          ),
        }}
      />

      <View style={styles.column}>
        <View style={styles.top}>
          <Text tone="muted" variant="small">
            {meta.description}
          </Text>

          <View style={styles.searchRow}>
            <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Icon name="search" size={18} color={colors.mutedForeground} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={`Search ${meta.title.toLowerCase()} by subject or code`}
                placeholderTextColor={colors.mutedForeground}
                style={[styles.searchInput, { color: colors.foreground, fontFamily: fonts.regular }]}
                returnKeyType="search"
                autoCorrect={false}
                selectionColor={colors.primary}
              />
              {search ? (
                <Pressable onPress={() => setSearch("")} hitSlop={10} accessibilityLabel="Clear search">
                  <Icon name="x-circle" size={18} color={colors.mutedForeground} />
                </Pressable>
              ) : null}
            </View>

            <PressableScale
              onPress={() => setFiltersOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`Filters${active ? `, ${active} applied` : ""}`}
              style={[styles.filterBtn, { backgroundColor: active ? accent : colors.card, borderColor: active ? accent : colors.border }]}
            >
              <Icon name="sliders" size={19} color={active ? colors[`${meta.accent}Foreground` as const] : colors.foreground} />
              {active ? (
                <View style={[styles.dot, { backgroundColor: colors.foreground }]}>
                  <Text variant="caption" color={colors.background} style={{ fontSize: 10, lineHeight: 13 }}>
                    {active}
                  </Text>
                </View>
              ) : null}
            </PressableScale>
          </View>

          {chips.length > 0 ? (
            <View style={styles.chips}>
              {chips.map((c) => (
                <Pressable key={c.key} onPress={() => clearChip(c.key)} accessibilityRole="button" accessibilityLabel={`Remove filter ${c.label}`}>
                  <View style={[styles.chip, { backgroundColor: `${accent}30` }]}>
                    <Text variant="caption" color={accent}>
                      {c.label}
                    </Text>
                    <Icon name="x" size={12} color={accent} />
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}

          {!loading && entries.length > 0 ? (
            <Text variant="caption" tone="muted" weight="regular">
              {isPyq ? `${total.toLocaleString()} ${total === 1 ? "paper" : "papers"}` : `${entries.length} ${entries.length === 1 ? "result" : "results"}`}
            </Text>
          ) : null}
        </View>

        <FlashList
          data={entries}
          keyExtractor={(e) => e.key}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
              <ResourceCard entry={item} onPress={setSelected} />
            </View>
          )}
          ListEmptyComponent={
            loading ? (
              <View style={{ paddingHorizontal: 16 }}>
                <SkeletonList kind="row" count={6} />
              </View>
            ) : isError ? (
              <ErrorState message={errorObj ? getErrorMessage(errorObj) : "Couldn't load results. Please try again."} onRetry={refetch} />
            ) : (
              <EmptyState
                icon={meta.icon}
                title={`No ${meta.title.toLowerCase()} found`}
                description={
                  hasActiveFilters(filters)
                    ? "Try a different search or clear a few filters."
                    : `Nothing here yet — be the first to share a ${meta.noun.toLowerCase()}.`
                }
                actionLabel={hasActiveFilters(filters) ? "Clear filters" : `Share a ${meta.noun.toLowerCase()}`}
                onAction={() => {
                  if (hasActiveFilters(filters)) {
                    setSearch("");
                    setApplied(EMPTY_FILTERS);
                  } else router.push({ pathname: "/upload", params: { kind } });
                }}
              />
            )
          }
          ListFooterComponent={isPyq && pyqs.isFetchingNextPage ? <ActivityIndicator style={{ padding: 20 }} color={colors.primary} /> : undefined}
          onEndReached={() => {
            if (isPyq && pyqs.hasNextPage && !pyqs.isFetchingNextPage) pyqs.fetchNextPage();
          }}
          onEndReachedThreshold={1.5}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        />
      </View>

      <FilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={applied}
        options={options}
        codePlaceholder={meta.codePlaceholder}
        onApply={(f) => setApplied({ ...f, query: "" })}
      />
      <ResourceSheet entry={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  column: { flex: 1, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" },
  top: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10, gap: 12 },
  searchRow: { flexDirection: "row", gap: 10 },
  search: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, height: 48, borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 15, height: 48 },
  filterBtn: { width: 48, height: 48, borderRadius: radius.lg, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
});
