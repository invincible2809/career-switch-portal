"use client";

import { useActionState } from "react";
import { deleteAccountAction } from "../actions";
import { Field, Input } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import type { FormState } from "@/lib/schemas/auth";

export function DeleteAccountForm() {
  const [state, action] = useActionState<FormState, FormData>(deleteAccountAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessages state={state} labels={{ password: "Password", confirm: "Confirmation" }} />
      <Field id="password" label="Your password" error={fe.password}>
        {(a) => <Input {...a} name="password" type="password" autoComplete="current-password" />}
      </Field>
      <Field id="confirm" label="Type DELETE to confirm" error={fe.confirm}>
        {(a) => <Input {...a} name="confirm" autoComplete="off" />}
      </Field>
      <SubmitButton variant="danger" pendingText="Deleting…">
        Delete my account and data
      </SubmitButton>
    </form>
  );
}
