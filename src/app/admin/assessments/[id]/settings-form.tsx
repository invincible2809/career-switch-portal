"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { updateAssessmentAction } from "../../actions";
import { Field, Input, Select } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import type { FormState } from "@/lib/schemas/auth";

export function AssessmentSettingsForm({
  id,
  values,
}: {
  id: string;
  values: { passMark: number; drawCount: number; cooldownMinutes: number; status: string };
}) {
  const { state, formProps, pending } = useFormAction<FormState>(updateAssessmentAction);
  const fe = state.fieldErrors ?? {};
  return (
    <form {...formProps} className="space-y-4" noValidate>
      <FormMessages state={state} labels={{ passMark: "Pass mark", drawCount: "Questions per attempt", cooldownMinutes: "Break between attempts" }} />
      <input type="hidden" name="assessmentId" value={id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="passMark" label="Pass mark (%)" error={fe.passMark}>
          {(a) => <Input {...a} name="passMark" type="number" min={1} max={100} defaultValue={values.passMark} />}
        </Field>
        <Field id="drawCount" label="Questions per attempt" error={fe.drawCount}>
          {(a) => <Input {...a} name="drawCount" type="number" min={1} max={50} defaultValue={values.drawCount} />}
        </Field>
        <Field id="cooldownMinutes" label="Break between attempts (minutes)" hint="0 means learners can try again straight away" error={fe.cooldownMinutes}>
          {(a) => <Input {...a} name="cooldownMinutes" type="number" min={0} defaultValue={values.cooldownMinutes} />}
        </Field>
        <Field id="status" label="Status">
          {(a) => (
            <Select {...a} name="status" defaultValue={values.status}>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft (hidden from learners)</option>
            </Select>
          )}
        </Field>
      </div>
      <SubmitButton pending={pending}>Save settings</SubmitButton>
    </form>
  );
}
