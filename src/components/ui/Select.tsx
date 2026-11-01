import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, TextInput, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { fonts, radius } from "@/theme/tokens";
import { Icon } from "./Icon";
import { PressableScale } from "./PressableScale";
import { Sheet } from "./Sheet";
import { Text } from "./Text";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  label?: string;
  value: string | null | undefined;
  options: (string | SelectOption)[];
  onChange: (value: string | null) => void;
  placeholder?: string;
  error?: string;
  /** Adds a search box — worth it past ~12 options (programmes, courses). */
  searchable?: boolean;
  /** Shows a "clear" row so a filter can be unset. */
  clearable?: boolean;
  /** Title of the picker sheet. Defaults to the label. */
  title?: string;
  compact?: boolean;
}

const normalise = (o: string | SelectOption): SelectOption =>
  typeof o === "string" ? { label: o, value: o } : o;

export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
  error,
  searchable,
  clearable,
  title,
  compact,
}: SelectProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const items = useMemo(() => options.map(normalise), [options]);
  const selected = items.find((o) => o.value === value);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((o) => o.label.toLowerCase().includes(q)) : items;
  }, [items, search]);

  const close = () => {
    setOpen(false);
    setSearch("");
  };

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text variant="small" weight="semibold" style={{ marginLeft: 2 }}>
          {label}
        </Text>
      ) : null}

      <PressableScale
        onPress={() => setOpen(true)}
        scaleTo={0.99}
        accessibilityRole="button"
        accessibilityLabel={`${label ?? placeholder}: ${selected?.label ?? "not selected"}`}
        style={[
          styles.field,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.destructive : selected && compact ? colors.primary : colors.border,
            minHeight: compact ? 40 : 48,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          tone={selected ? "default" : "muted"}
          style={{ flex: 1 }}
          weight={selected ? "medium" : "regular"}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Icon name="chevron-down" size={18} color={colors.mutedForeground} />
      </PressableScale>

      {error ? (
        <Text variant="small" tone="destructive" style={{ marginLeft: 2 }}>
          {error}
        </Text>
      ) : null}

      <Sheet visible={open} onClose={close} title={title ?? label ?? placeholder} scroll={false} maxHeight={0.8}>
        {searchable ? (
          <View style={[styles.search, { backgroundColor: colors.secondary }]}>
            <Icon name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground, fontFamily: fonts.regular }]}
              autoCorrect={false}
            />
          </View>
        ) : null}

        <FlatList
          data={visible}
          keyExtractor={(o) => o.value}
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: 420 }}
          ListHeaderComponent={
            clearable && value ? (
              <Row
                label="Clear selection"
                tone="destructive"
                onPress={() => {
                  onChange(null);
                  close();
                }}
              />
            ) : undefined
          }
          ListEmptyComponent={
            <Text tone="muted" align="center" style={{ paddingVertical: 24 }}>
              No matches
            </Text>
          }
          renderItem={({ item }) => (
            <Row
              label={item.label}
              selected={item.value === value}
              onPress={() => {
                onChange(item.value);
                close();
              }}
            />
          )}
        />
      </Sheet>
    </View>
  );
}

function Row({
  label,
  selected,
  tone,
  onPress,
}: {
  label: string;
  selected?: boolean;
  tone?: "destructive";
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.99}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.row, selected && { backgroundColor: colors.primarySoft }]}
    >
      <Text style={{ flex: 1 }} tone={tone ?? (selected ? "primary" : "default")} weight={selected ? "semibold" : "regular"}>
        {label}
      </Text>
      {selected ? <Icon name="check" size={18} color={colors.primary} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    marginBottom: 6,
  },
  searchInput: { flex: 1, height: 42, fontSize: 15 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
});
