"use client";

import { useActionState } from "react";
import { updateAccessibilityAction } from "../actions";
import { Field, Select } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import type { FormState } from "@/lib/schemas/auth";

export function AccessibilityForm({
  values,
}: {
  values: { textScale: string; dyslexiaFont: boolean; reducedMotion: boolean; readAloud: boolean };
}) {
  const [state, action] = useActionState<FormState, FormData>(updateAccessibilityAction, {});
  return (
    <form action={action} className="space-y-5">
      <FormMessages state={state} />
      <Field id="textScale" label="Text size">
        {(a) => (
          <Select {...a} name="textScale" defaultValue={values.textScale}>
            <option value="DEFAULT">Standard</option>
            <option value="LARGE">Large</option>
            <option value="LARGER">Larger</option>
          </Select>
        )}
      </Field>
      {(
        [
          ["dyslexiaFont", "Use a dyslexia-friendly font (Atkinson Hyperlegible)"],
          ["reducedMotion", "Reduce movement and animation"],
          ["readAloud", "Show a 'Read aloud' button on lessons (uses your browser's built-in voice)"],
        ] as const
      ).map(([name, label]) => (
        <div key={name} className="flex items-start gap-3">
          <input id={name} name={name} type="checkbox" defaultChecked={values[name]} className="mt-1 h-5 w-5" />
          <label htmlFor={name}>{label}</label>
        </div>
      ))}
      <SubmitButton pendingText="Saving…">Save display settings</SubmitButton>
    </form>
  );
}
