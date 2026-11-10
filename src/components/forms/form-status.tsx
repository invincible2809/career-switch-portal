"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Alert } from "@/components/ui/card";
import type { FormState } from "@/lib/schemas/auth";

export function SubmitButton({ children, pendingText, ...props }: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending} {...props}>
      {pending ? (pendingText ?? "Please wait…") : children}
    </Button>
  );
}

/** Form-level messages. Field errors are shown next to each field and listed here as links (error summary). */
export function FormMessages({ state, labels }: { state: FormState; labels?: Record<string, string> }) {
  const fieldEntries = Object.entries(state.fieldErrors ?? {});
  if (!state.error && !state.ok && fieldEntries.length === 0) return null;
  return (
    <div role="alert" aria-live="assertive" className="space-y-2">
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {fieldEntries.length > 0 ? (
        <Alert tone="danger">
          <p className="font-semibold">There is a problem</p>
          <ul className="mt-1 list-disc pl-5">
            {fieldEntries.map(([field, message]) => (
              <li key={field}>
                <a href={`#${field}`}>{labels?.[field] ? `${labels[field]}: ${message}` : message}</a>
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}
    </div>
  );
}
