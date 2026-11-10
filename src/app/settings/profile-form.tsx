"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { updateProfileAction } from "./actions";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import { INDUSTRIES } from "@/lib/onboarding/skills-map";
import { WEEKLY_OPTIONS } from "@/lib/schemas/onboarding";
import type { FormState } from "@/lib/schemas/auth";

export interface ProfileValues {
  displayName: string;
  pathway: string;
  weeklyMinutes: number;
  goal: string;
  consent: boolean;
  previousRoles: string;
  industry: string;
}

export function ProfileForm({ values }: { values: ProfileValues }) {
  const { state, formProps, pending } = useFormAction<FormState>(updateProfileAction);
  const fe = state.fieldErrors ?? {};
  return (
    <form {...formProps} className="space-y-5" noValidate>
      <FormMessages state={state} labels={{ displayName: "Your name", pathway: "Pathway", weeklyMinutes: "Study time" }} />
      <Field id="displayName" label="Your name" hint="Shown on your certificate of completion." error={fe.displayName}>
        {(a) => <Input {...a} name="displayName" defaultValue={values.displayName} autoComplete="name" />}
      </Field>
      <Field id="pathway" label="Your pathway" hint="Switching keeps all your progress." error={fe.pathway}>
        {(a) => (
          <Select {...a} name="pathway" defaultValue={values.pathway}>
            <option value="scrum-master">Scrum Master</option>
            <option value="qa-tester">QA Tester</option>
          </Select>
        )}
      </Field>
      <Field id="weeklyMinutes" label="Weekly study time" error={fe.weeklyMinutes}>
        {(a) => (
          <Select {...a} name="weeklyMinutes" defaultValue={String(values.weeklyMinutes)}>
            {WEEKLY_OPTIONS.map((o) => (
              <option key={o.minutes} value={o.minutes}>
                {o.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field id="goal" label="Your goal (optional)">
        {(a) => <Textarea {...a} name="goal" defaultValue={values.goal} maxLength={300} className="min-h-20" />}
      </Field>
      <fieldset className="space-y-3 rounded-md border border-border p-4">
        <legend className="px-1 font-semibold">Optional information</legend>
        <div className="flex items-start gap-3">
          <input id="consent" name="consent" type="checkbox" defaultChecked={values.consent} className="mt-1 h-5 w-5" />
          <label htmlFor="consent">
            Store my previous job and industry to personalise my plan. Untick to remove them.
          </label>
        </div>
        <Field id="previousRoles" label="Previous job titles" hint="Separate them with commas.">
          {(a) => <Input {...a} name="previousRoles" defaultValue={values.previousRoles} maxLength={300} />}
        </Field>
        <Field id="industry" label="Industry">
          {(a) => (
            <Select {...a} name="industry" defaultValue={values.industry}>
              <option value="">Prefer not to say</option>
              {INDUSTRIES.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </fieldset>
      <SubmitButton pending={pending} pendingText="Saving…">Save settings</SubmitButton>
    </form>
  );
}
