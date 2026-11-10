"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { deleteAccountAction } from "../actions";
import { Field, Input } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import type { FormState } from "@/lib/schemas/auth";

export function DeleteAccountForm() {
  const { state, formProps, pending } = useFormAction<FormState>(deleteAccountAction);
  const fe = state.fieldErrors ?? {};
  return (
    <form {...formProps} className="space-y-4" noValidate>
      <FormMessages state={state} labels={{ password: "Password", confirm: "Confirmation" }} />
      <Field id="password" label="Your password" error={fe.password}>
        {(a) => <Input {...a} name="password" type="password" autoComplete="current-password" />}
      </Field>
      <Field id="confirm" label="Type DELETE to confirm" error={fe.confirm}>
        {(a) => <Input {...a} name="confirm" autoComplete="off" />}
      </Field>
      <SubmitButton pending={pending} variant="danger" pendingText="Deleting…">
        Delete my account and data
      </SubmitButton>
    </form>
  );
}
