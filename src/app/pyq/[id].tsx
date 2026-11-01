import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { getErrorMessage } from "@/api/errors";
import { ResourceDetail } from "@/components/library/ResourceSheet";
import { ErrorState, SkeletonList } from "@/components/ui";
import { fromResource } from "@/hooks/library";
import { usePyq } from "@/hooks/library";
import { useTheme } from "@/theme/ThemeProvider";
import { MAX_CONTENT_WIDTH } from "@/theme/tokens";

/** Deep link target for a single question paper (sharda.social/library/pyqs/:id). */
export default function PyqScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const query = usePyq(id);
  const entry = useMemo(() => (query.data ? fromResource("pyqs", query.data) : null), [query.data]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" }}>
        {query.isLoading ? (
          <SkeletonList kind="row" count={2} />
        ) : entry ? (
          <ResourceDetail entry={entry} />
        ) : (
          <ErrorState message={query.error ? getErrorMessage(query.error) : "This paper may have been removed."} onRetry={() => query.refetch()} />
        )}
      </ScrollView>
    </View>
  );
}
