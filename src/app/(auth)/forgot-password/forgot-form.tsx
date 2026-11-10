"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { forgotPasswordAction } from "../actions";
import { Field, Input } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import type { FormState } from "@/lib/schemas/auth";

export function ForgotForm() {
  const { state, formProps, pending } = useFormAction<FormState>(forgotPasswordAction);
  return (
    <form {...formProps} className="space-y-5" noValidate>
      <FormMessages state={state} labels={{ email: "Email" }} />
      <Field id="email" label="Email" error={state.fieldErrors?.email}>
        {(a) => <Input {...a} name="email" type="email" autoComplete="email" required />}
      </Field>
      <SubmitButton pending={pending} pendingText="Sending…">Send reset link</SubmitButton>
    </form>
  );
}
