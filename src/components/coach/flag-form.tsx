"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { flagCoachAnswerAction } from "@/app/coach/actions";
import { Textarea } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import type { FormState } from "@/lib/schemas/auth";

export function FlagForm({ messageId }: { messageId: string }) {
  const { state, formProps, pending } = useFormAction<FormState>(flagCoachAnswerAction);
  if (state.ok) return <p role="status" className="text-sm font-semibold text-success">{state.ok}</p>;
  return (
    <details>
      <summary className="cursor-pointer text-sm font-semibold text-primary">Flag this answer</summary>
      <form {...formProps} className="mt-2 space-y-2">
        <FormMessages state={state} />
        <input type="hidden" name="messageId" value={messageId} />
        <label htmlFor={`flag-${messageId}`} className="block text-sm font-semibold">
          What&apos;s wrong with this answer?
        </label>
        <Textarea id={`flag-${messageId}`} name="reason" maxLength={1000} className="min-h-16" />
        <SubmitButton pending={pending} variant="secondary" size="sm">
          Send to an admin
        </SubmitButton>
      </form>
    </details>
  );
}
