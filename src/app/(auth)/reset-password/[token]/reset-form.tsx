"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { resetPasswordAction } from "../../actions";
import { Field, Input } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import type { FormState } from "@/lib/schemas/auth";

export function ResetForm({ token }: { token: string }) {
  const { state, formProps, pending } = useFormAction<FormState>(resetPasswordAction);
  const fe = state.fieldErrors ?? {};
  return (
    <form {...formProps} className="space-y-5" noValidate>
      <FormMessages state={state} labels={{ password: "New password", confirmPassword: "Confirm new password" }} />
      <input type="hidden" name="token" value={token} />
      <Field id="password" label="New password" hint="At least 10 characters." error={fe.password}>
        {(a) => <Input {...a} name="password" type="password" autoComplete="new-password" required />}
      </Field>
      <Field id="confirmPassword" label="Confirm new password" error={fe.confirmPassword}>
        {(a) => <Input {...a} name="confirmPassword" type="password" autoComplete="new-password" required />}
      </Field>
      <SubmitButton pending={pending} pendingText="Saving…">Save new password</SubmitButton>
    </form>
  );
}
