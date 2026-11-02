import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Keyboard, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { getErrorMessage } from "@/api/errors";
import type { ResourceKind } from "@/api/types";
import { ResourceCard } from "@/components/library/ResourceCard";
import { ResourceSheet } from "@/components/library/ResourceSheet";
import { EmptyState, ErrorState, Icon, Pills, PressableScale, Screen, SkeletonList, TabHeader, Text } from "@/components/ui";
import { KIND_META, KIND_ORDER } from "@/constants/library";
import { LibraryEntry, searchResultToEntry, useGlobalSearch } from "@/hooks/library";
import { useDebounced } from "@/hooks/useDebounced";
import { useRecentSearches } from "@/hooks/recentSearches";
import { useTheme } from "@/theme/ThemeProvider";
import { fonts, radius } from "@/theme/tokens";

type Scope = "all" | ResourceKind;

const POPULAR = ["Data Structures", "DBMS", "Operating Systems", "Python", "Probability", "CSE249"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * One search box across notes, question papers and syllabus. Before you type
 * it offers ways in (browse a section, jump to a semester, re-run a recent
 * search); once you do, results are filtered between kinds instantly.
 */
export default function ExploreScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const recents = useRecentSearches();

  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [scope, setScope] = useState<Scope>("all");
  const [selected, setSelected] = useState<LibraryEntry | null>(null);

  const query = useDebounced(text.trim(), 350);
  const active = query.length >= 2;
  // Always search every kind and filter locally: switching tabs is then instant
  // and each tab can show how many results it holds.
  const search = useGlobalSearch({ query: query.slice(0, 100), type: "all" }, active);

  const all = useMemo(() => (active ? (search.data ?? []).map(searchResultToEntry) : []), [active, search.data]);
  const counts = useMemo(() => {
    const c: Record<Scope, number> = { all: all.length, pyqs: 0, notes: 0, syllabus: 0 };
    for (const e of all) c[e.kind] += 1;
    return c;
  }, [all]);
  const shown = useMemo(() => (scope === "all" ? all : all.filter((e) => e.kind === scope)), [all, scope]);

  const run = (term: string) => {
    setText(term);
    recents.add(term);
    Keyboard.dismiss();
  };

  const open = (entry: LibraryEntry) => {
    recents.add(query);
    setSelected(entry);
  };

  const scopes = [
    { value: "all" as Scope, label: "All", count: active ? counts.all : undefined },
    ...KIND_ORDER.map((k) => ({
      value: k as Scope,
      label: KIND_META[k].title === "Question papers" ? "Papers" : KIND_META[k].title,
      icon: KIND_META[k].icon,
      count: active ? counts[k] : undefined,
    })),
  ];

  return (
    <Screen>
      <TabHeader title="Explore" />

      <View style={styles.searchWrap}>
        <View
          style={[
            styles.search,
            { backgroundColor: colors.card, borderColor: focused ? colors.primary : colors.border, borderWidth: focused ? 1.5 : 1 },
          ]}
        >
          <Icon name="search" size={20} color={focused ? colors.primary : colors.mutedForeground} />
          <TextInput
            value={text}
            onChangeText={setText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search subjects, course codes, programmes"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, fontFamily: fonts.regular }]}
            returnKeyType="search"
            autoCorrect={false}
            selectionColor={colors.primary}
            onSubmitEditing={() => run(text.trim())}
            accessibilityLabel="Search the library"
          />
          {text ? (
            <Pressable onPress={() => setText("")} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
              <Icon name="x-circle" size={20} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {active ? (
        <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1 }}>
          <Pills items={scopes} value={scope} onChange={setScope} small />
          <FlatList
            data={shown}
            keyExtractor={(e) => e.key}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => <ResourceCard entry={item} onPress={open} />}
            ListEmptyComponent={
              search.isLoading || (search.isFetching && all.length === 0) ? (
                <SkeletonList kind="row" count={5} />
              ) : search.isError ? (
                <ErrorState message={getErrorMessage(search.error)} onRetry={() => search.refetch()} />
              ) : (
                <EmptyState
                  icon="search"
                  title="No matches"
                  description={
                    scope !== "all" && counts.all > 0
                      ? `No ${KIND_META[scope].title.toLowerCase()} for “${query}”, but there are results in other sections.`
                      : `Nothing found for “${query}”. Check the spelling or try a course code.`
                  }
                  actionLabel={scope !== "all" && counts.all > 0 ? "Show everything" : undefined}
                  onAction={() => setScope("all")}
                />
              )
            }
          />
        </Animated.View>
      ) : (
        <ScrollView contentContainerStyle={styles.idle} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(380)} style={styles.section}>
            <Text variant="subheading">Browse</Text>
            <View style={styles.tiles}>
              {KIND_ORDER.map((k) => {
                const meta = KIND_META[k];
                const bg = colors[meta.accent];
                const fg = colors[`${meta.accent}Foreground` as const];
                return (
                  <PressableScale
                    key={k}
                    onPress={() => router.push({ pathname: "/library/[kind]", params: { kind: k } })}
                    accessibilityRole="button"
                    accessibilityLabel={`Browse ${meta.title}`}
                    style={[styles.tile, { backgroundColor: bg }]}
                  >
                    <Icon name={meta.icon} size={24} color={fg} />
                    <Text weight="bold" variant="small" color={fg} numberOfLines={1}>
                      {k === "pyqs" ? "Papers" : meta.title}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(70).duration(380)} style={styles.section}>
            <Text variant="subheading">Question papers by semester</Text>
            <View style={styles.chips}>
              {SEMESTERS.map((n) => (
                <PressableScale
                  key={n}
                  onPress={() => router.push({ pathname: "/library/[kind]", params: { kind: "pyqs", semester: String(n) } })}
                  accessibilityRole="button"
                  accessibilityLabel={`Semester ${n} papers`}
                  style={[styles.semChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Text weight="bold" tone="primary">
                    {n}
                  </Text>
                  <Text variant="caption" tone="muted" weight="regular">
                    Sem
                  </Text>
                </PressableScale>
              ))}
            </View>
          </Animated.View>

          {recents.recent.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(130).duration(380)} style={styles.section}>
              <View style={styles.rowBetween}>
                <Text variant="subheading">Recent</Text>
                <Pressable onPress={recents.clear} hitSlop={10} accessibilityRole="button">
                  <Text variant="small" tone="primary" weight="semibold">
                    Clear
                  </Text>
                </Pressable>
              </View>
              {recents.recent.map((term) => (
                <View key={term} style={styles.recentRow}>
                  <PressableScale onPress={() => run(term)} scaleTo={0.99} style={styles.recentMain} accessibilityRole="button">
                    <Icon name="clock" size={17} color={colors.mutedForeground} />
                    <Text numberOfLines={1} style={{ flex: 1 }}>
                      {term}
                    </Text>
                  </PressableScale>
                  <Pressable onPress={() => recents.remove(term)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove ${term}`}>
                    <Icon name="x" size={16} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              ))}
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(190).duration(380)} style={styles.section}>
            <Text variant="subheading">Popular searches</Text>
            <View style={styles.chips}>
              {POPULAR.map((term) => (
                <PressableScale
                  key={term}
                  onPress={() => run(term)}
                  accessibilityRole="button"
                  style={[styles.suggestion, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Icon name="trending-up" size={14} color={colors.primary} />
                  <Text variant="small" weight="semibold">
                    {term}
                  </Text>
                </PressableScale>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      )}

      <ResourceSheet entry={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  search: { flexDirection: "row", alignItems: "center", gap: 10, height: 54, borderRadius: radius.xl, paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 15.5, height: 54 },
  list: { padding: 16, paddingTop: 8, paddingBottom: 32 },
  idle: { padding: 16, paddingTop: 6, gap: 26, paddingBottom: 32 },
  section: { gap: 12 },
  tiles: { flexDirection: "row", gap: 10 },
  tile: { flex: 1, height: 88, borderRadius: radius.xl, padding: 14, justifyContent: "space-between" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  semChip: { width: 62, height: 62, borderRadius: radius.lg, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  suggestion: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 38, borderRadius: radius.pill, borderWidth: 1 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  recentRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 },
  recentMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
});
