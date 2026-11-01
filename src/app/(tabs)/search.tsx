import React, { useMemo, useState } from "react";
import { FlatList, Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";
import { getErrorMessage } from "@/api/errors";
import type { ResourceKind } from "@/api/types";
import { ResourceCard } from "@/components/library/ResourceCard";
import { ResourceSheet } from "@/components/library/ResourceSheet";
import { EmptyState, ErrorState, Icon, Pills, Screen, SkeletonList, TabHeader, Text } from "@/components/ui";
import { KIND_META } from "@/constants/library";
import { LibraryEntry, searchResultToEntry, useGlobalSearch } from "@/hooks/library";
import { useDebounced } from "@/hooks/useDebounced";
import { useTheme } from "@/theme/ThemeProvider";
import { fonts, radius } from "@/theme/tokens";

type Scope = "all" | ResourceKind;

const SCOPES = [
  { value: "all" as Scope, label: "All" },
  { value: "notes" as Scope, label: "Notes", icon: KIND_META.notes.icon },
  { value: "pyqs" as Scope, label: "PYQs", icon: KIND_META.pyqs.icon },
  { value: "syllabus" as Scope, label: "Syllabus", icon: KIND_META.syllabus.icon },
];

const SUGGESTIONS = ["Data Structures", "DBMS", "CSE249", "Operating Systems", "Python", "Probability"];

/** Search across notes, question papers and syllabus in one place. */
export default function ExploreScreen() {
  const { colors } = useTheme();
  const [text, setText] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [selected, setSelected] = useState<LibraryEntry | null>(null);

  const query = useDebounced(text.trim(), 350);
  const enabled = query.length >= 2;
  const search = useGlobalSearch({ query: query.slice(0, 100), type: scope }, enabled);

  const entries = useMemo(() => (enabled ? (search.data ?? []).map(searchResultToEntry) : []), [enabled, search.data]);

  return (
    <Screen>
      <TabHeader title="Explore" subtitle="Find notes, papers and syllabus across the library" />

      <View style={styles.searchWrap}>
        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="search" size={19} color={colors.mutedForeground} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Subject, course code or programme"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, fontFamily: fonts.regular }]}
            returnKeyType="search"
            autoCorrect={false}
            selectionColor={colors.primary}
            onSubmitEditing={() => Keyboard.dismiss()}
            accessibilityLabel="Search the library"
          />
          {text ? (
            <Pressable onPress={() => setText("")} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
              <Icon name="x-circle" size={19} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <Pills items={SCOPES} value={scope} onChange={setScope} small />

      <FlatList
        data={entries}
        keyExtractor={(e) => e.key}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => <ResourceCard entry={item} onPress={setSelected} />}
        ListHeaderComponent={
          enabled && entries.length > 0 ? (
            <Text variant="caption" tone="muted" weight="regular" style={{ marginBottom: 10 }}>
              {entries.length} {entries.length === 1 ? "result" : "results"} for “{query}”
            </Text>
          ) : undefined
        }
        ListEmptyComponent={
          !enabled ? (
            <View style={{ gap: 14, paddingTop: 12 }}>
              <Text weight="semibold">Try searching for</Text>
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setText(s)}
                    accessibilityRole="button"
                    style={[styles.suggestion, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Icon name="trending-up" size={14} color={colors.primary} />
                    <Text variant="small" weight="semibold">
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : search.isLoading || search.isFetching ? (
            <SkeletonList kind="row" count={5} />
          ) : search.isError ? (
            <ErrorState message={getErrorMessage(search.error)} onRetry={() => search.refetch()} />
          ) : (
            <EmptyState icon="search" title="No matches" description={`Nothing found for “${query}”. Check the spelling or try a course code.`} />
          )
        }
      />

      <ResourceSheet entry={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  search: { flexDirection: "row", alignItems: "center", gap: 10, height: 50, borderRadius: radius.xl, borderWidth: 1, paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 15.5, height: 50 },
  list: { padding: 16, paddingBottom: 40 },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestion: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
});
