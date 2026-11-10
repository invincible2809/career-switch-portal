"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { saveSkillsStatementAction } from "@/app/career/actions";
import { Textarea } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import type { FormState } from "@/lib/schemas/auth";

export function SkillsStatementForm({ initial }: { initial: string }) {
  const { state, formProps, pending } = useFormAction<FormState>(saveSkillsStatementAction);
  return (
    <form {...formProps} className="space-y-2">
      <FormMessages state={state} />
      <label htmlFor="skills-statement" className="block font-semibold">
        Your transferable-skills statement
      </label>
      <Textarea id="skills-statement" name="body" defaultValue={initial} maxLength={3000} className="min-h-40" />
      <SubmitButton pending={pending}>Save statement</SubmitButton>
    </form>
  );
}
