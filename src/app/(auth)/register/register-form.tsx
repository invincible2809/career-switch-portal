"use client";

import { useActionState } from "react";
import { registerAction } from "../actions";
import { Field, Input } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import type { FormState } from "@/lib/schemas/auth";

const labels = {
  displayName: "Your name",
  email: "Email",
  password: "Password",
  confirmPassword: "Confirm password",
  privacy: "Privacy notice",
};

export function RegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(registerAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessages state={state} labels={labels} />
      <Field id="displayName" label={labels.displayName} hint="This is the name shown on your certificate of completion. You can change it later." error={fe.displayName}>
        {(a) => <Input {...a} name="displayName" autoComplete="name" defaultValue={state.values?.displayName} required />}
      </Field>
      <Field id="email" label={labels.email} error={fe.email}>
        {(a) => <Input {...a} name="email" type="email" autoComplete="email" defaultValue={state.values?.email} required />}
      </Field>
      <Field id="password" label={labels.password} hint="At least 10 characters. A short phrase is easier to remember." error={fe.password}>
        {(a) => <Input {...a} name="password" type="password" autoComplete="new-password" required />}
      </Field>
      <Field id="confirmPassword" label={labels.confirmPassword} error={fe.confirmPassword}>
        {(a) => <Input {...a} name="confirmPassword" type="password" autoComplete="new-password" required />}
      </Field>
      <div className="space-y-1">
        {fe.privacy ? (
          <p id="privacy-error" className="text-sm font-semibold text-danger">
            <span className="sr-only">Error: </span>
            {fe.privacy}
          </p>
        ) : null}
        <div className="flex items-start gap-3">
          <input
            id="privacy"
            name="privacy"
            type="checkbox"
            className="mt-1 h-5 w-5"
            aria-describedby={fe.privacy ? "privacy-error" : undefined}
            aria-invalid={fe.privacy ? true : undefined}
          />
          <label htmlFor="privacy">
            I have read the <a href="/privacy" target="_blank" rel="noopener">privacy notice (opens in a new tab)</a>
          </label>
        </div>
      </div>
      <SubmitButton pendingText="Creating your account…">Create account</SubmitButton>
    </form>
  );
}
