// shadcn Field + react-hook-form Controller in one wrapper, so a form field is one block:
// <FormField control={form.control} name="phone" label="연락처">{(field) => <PhoneInput {...field} />}</FormField>
import type { ReactNode } from "react"
import { Controller, type Control, type ControllerRenderProps, type FieldPath, type FieldValues } from "react-hook-form"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"

type Props<T extends FieldValues, N extends FieldPath<T>> = {
  control: Control<T>
  name: N
  label: string
  description?: string
  className?: string
  children: (field: ControllerRenderProps<T, N> & { id: string; "aria-invalid": boolean }) => ReactNode
}

export function FormField<T extends FieldValues, N extends FieldPath<T>>({
  control, name, label, description, className, children,
}: Props<T, N>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          {children({ ...field, id: name, "aria-invalid": fieldState.invalid })}
          {description && !fieldState.invalid && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
