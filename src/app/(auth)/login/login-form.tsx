"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { loginAction } from "../actions";
import { Field, Input } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import type { FormState } from "@/lib/schemas/auth";

export function LoginForm({ next }: { next?: string }) {
  const { state, formProps, pending } = useFormAction<FormState>(loginAction);
  const fe = state.fieldErrors ?? {};
  return (
    <form {...formProps} className="space-y-5" noValidate>
      <FormMessages state={state} labels={{ email: "Email", password: "Password" }} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field id="email" label="Email" error={fe.email}>
        {(a) => <Input {...a} name="email" type="email" autoComplete="email" defaultValue={state.values?.email} required />}
      </Field>
      <Field id="password" label="Password" error={fe.password}>
        {(a) => <Input {...a} name="password" type="password" autoComplete="current-password" required />}
      </Field>
      <SubmitButton pending={pending} pendingText="Logging in…">Log in</SubmitButton>
    </form>
  );
}
