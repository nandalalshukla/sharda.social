import React from "react";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { Input, InputProps } from "@/components/ui";

type Props<T extends FieldValues> = Omit<InputProps, "value" | "onChangeText" | "error"> & {
  control: Control<T>;
  name: FieldPath<T>;
  /** Extra transform applied as the user types (e.g. strip non-digits). */
  transform?: (text: string) => string;
};

/** react-hook-form binding for `Input`, so forms stay declarative. */
export function FormInput<T extends FieldValues>({ control, name, transform, ...rest }: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Input
          {...rest}
          ref={field.ref}
          value={(field.value as string | undefined) ?? ""}
          onBlur={field.onBlur}
          onChangeText={(text) => field.onChange(transform ? transform(text) : text)}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
