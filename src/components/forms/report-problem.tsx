"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { flagContentAction } from "@/app/flags/actions";
import { Textarea } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import type { FormState } from "@/lib/schemas/auth";

export function ReportProblem({ kind, targetId, label }: { kind: "LESSON" | "QUESTION"; targetId: string; label: string }) {
  const { state, formProps, pending } = useFormAction<FormState>(flagContentAction);
  if (state.ok) return <p role="status" className="text-sm font-semibold text-success">{state.ok}</p>;
  return (
    <details>
      <summary className="cursor-pointer text-sm font-semibold text-primary">{label}</summary>
      <form {...formProps} className="mt-2 space-y-2">
        <FormMessages state={state} />
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="targetId" value={targetId} />
        <label htmlFor={`report-${targetId}`} className="block text-sm font-semibold">
          What&apos;s wrong?
        </label>
        <Textarea id={`report-${targetId}`} name="reason" maxLength={1000} className="min-h-16" />
        <SubmitButton pending={pending} variant="secondary" size="sm">
          Send report
        </SubmitButton>
      </form>
    </details>
  );
}
