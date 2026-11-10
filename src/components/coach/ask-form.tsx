"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { askCoachAction } from "@/app/coach/actions";
import { Textarea } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import type { FormState } from "@/lib/schemas/auth";

export function AskForm() {
  const { state, formProps, pending } = useFormAction<FormState>(askCoachAction, {} as FormState, { resetOnSuccess: true });
  return (
    <form {...formProps} className="space-y-3">
      {state.error ? <FormMessages state={{ error: state.error }} /> : null}
      <label htmlFor="coach-question" className="block font-semibold">
        Your question
      </label>
      <Textarea id="coach-question" name="question" maxLength={500} className="min-h-20" placeholder="For example: what is the Definition of Done?" />
      <fieldset>
        <legend className="font-semibold">How should I answer?</legend>
        <div className="mt-1 flex flex-wrap gap-x-5 gap-y-2">
          {[
            ["ask", "From the course"],
            ["simpler", "Explain more simply"],
            ["my-job", "Relate it to my previous job"],
          ].map(([v, l], i) => (
            <label key={v} className="flex items-center gap-2">
              <input type="radio" name="mode" value={v} defaultChecked={i === 0} className="h-5 w-5" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      <SubmitButton pending={pending} pendingText="Looking it up…">
        Ask the coach
      </SubmitButton>
    </form>
  );
}
