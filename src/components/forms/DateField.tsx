import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform, View } from "react-native";
import { Icon, PressableScale, Sheet, Text, Button } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { radius } from "@/theme/tokens";
import { formatDate } from "@/utils/format";

/** `yyyy-mm-dd` in, `yyyy-mm-dd` out — the shape the backend's date field takes. */
const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function DateField({
  label,
  value,
  onChange,
  maximumDate = new Date(),
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  maximumDate?: Date;
}) {
  const { colors } = useTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ? new Date(value) : new Date());

  const open = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: value ? new Date(value) : new Date(),
        maximumDate,
        mode: "date",
        onChange: (e: DateTimePickerEvent, date?: Date) => {
          if (e.type === "set" && date) onChange(toIso(date));
        },
      });
    } else {
      setDraft(value ? new Date(value) : new Date());
      setIosOpen(true);
    }
  };

  return (
    <View style={{ gap: 6 }}>
      <Text variant="small" weight="semibold" style={{ marginLeft: 2 }}>
        {label}
      </Text>
      <PressableScale
        onPress={open}
        scaleTo={0.99}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDate(value) : "not set"}`}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          minHeight: 48,
          paddingHorizontal: 14,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        <Icon name="calendar" size={18} color={colors.mutedForeground} />
        <Text style={{ flex: 1 }} tone={value ? "default" : "muted"}>
          {value ? formatDate(value) : "Select a date"}
        </Text>
        {value ? (
          <PressableScale onPress={() => onChange("")} hitSlop={10} accessibilityLabel="Clear date">
            <Icon name="x-circle" size={18} color={colors.mutedForeground} />
          </PressableScale>
        ) : null}
      </PressableScale>

      {Platform.OS === "ios" ? (
        <Sheet
          visible={iosOpen}
          onClose={() => setIosOpen(false)}
          title={label}
          footer={
            <Button
              title="Done"
              fullWidth
              size="lg"
              onPress={() => {
                onChange(toIso(draft));
                setIosOpen(false);
              }}
            />
          }
        >
          <DateTimePicker
            value={draft}
            mode="date"
            display="inline"
            maximumDate={maximumDate}
            onChange={(_e, d) => d && setDraft(d)}
            themeVariant={colors.background === "#100e1a" ? "dark" : "light"}
          />
        </Sheet>
      ) : null}
    </View>
  );
}
