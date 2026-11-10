"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";
import { Field, Input } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import type { FormState } from "@/lib/schemas/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(loginAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessages state={state} labels={{ email: "Email", password: "Password" }} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field id="email" label="Email" error={fe.email}>
        {(a) => <Input {...a} name="email" type="email" autoComplete="email" defaultValue={state.values?.email} required />}
      </Field>
      <Field id="password" label="Password" error={fe.password}>
        {(a) => <Input {...a} name="password" type="password" autoComplete="current-password" required />}
      </Field>
      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
    </form>
  );
}
