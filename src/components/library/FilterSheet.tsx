import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, Input, Select, Sheet } from "@/components/ui";
import type { LibraryFilters } from "@/hooks/library";
import { EMPTY_FILTERS } from "@/hooks/library";

export interface FilterOptions {
  programs: string[];
  years: string[];
  semesters: string[];
}

/** Programme, semester, year and course code — applied together on "Show results". */
export function FilterSheet({
  visible,
  onClose,
  filters,
  options,
  codePlaceholder,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  filters: LibraryFilters;
  options: FilterOptions;
  codePlaceholder: string;
  onApply: (next: LibraryFilters) => void;
}) {
  const [draft, setDraft] = useState(filters);

  // Each time the sheet opens it starts from what is currently applied.
  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const patch = (p: Partial<LibraryFilters>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Filters"
      footer={
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button
            title="Reset"
            variant="secondary"
            size="lg"
            style={{ flex: 1, alignSelf: "stretch" }}
            onPress={() => {
              onApply({ ...EMPTY_FILTERS, query: filters.query });
              onClose();
            }}
          />
          <Button
            title="Show results"
            size="lg"
            style={{ flex: 2, alignSelf: "stretch" }}
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          />
        </View>
      }
    >
      <Select
        label="Programme"
        value={draft.program}
        options={options.programs}
        onChange={(program) => patch({ program })}
        placeholder="All programmes"
        searchable
        clearable
      />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Select
            label="Semester"
            value={draft.semester}
            options={options.semesters.map((s) => ({ value: s, label: `Semester ${s}` }))}
            onChange={(semester) => patch({ semester })}
            placeholder="Any"
            clearable
          />
        </View>
        <View style={{ flex: 1 }}>
          <Select label="Year" value={draft.year} options={options.years} onChange={(year) => patch({ year })} placeholder="Any" clearable />
        </View>
      </View>
      <Input
        label="Course code"
        value={draft.courseCode}
        onChangeText={(courseCode) => patch({ courseCode })}
        placeholder={codePlaceholder}
        autoCapitalize="characters"
        autoCorrect={false}
      />
    </Sheet>
  );
}
