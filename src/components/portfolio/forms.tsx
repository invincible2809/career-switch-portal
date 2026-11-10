"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { addLabWorkAction, addReflectionAction, addSubmissionAction, createShareAction, type ShareState } from "@/app/portfolio/actions";
import { Input, Select, Textarea } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import { Alert } from "@/components/ui/card";
import type { FormState } from "@/lib/schemas/auth";

export function AddSubmissionForm({ options }: { options: { id: string; label: string }[] }) {
  const { state, formProps, pending } = useFormAction<FormState>(addSubmissionAction);
  if (!options.length) return <p className="text-muted">Submit a practical assignment first – then you can add it here.</p>;
  return (
    <form {...formProps} className="space-y-2">
      <FormMessages state={state} />
      <label htmlFor="add-submission" className="block font-semibold">
        Practical assignment
      </label>
      <Select id="add-submission" name="submissionId">
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </Select>
      <SubmitButton pending={pending} variant="secondary">
        Add to portfolio
      </SubmitButton>
    </form>
  );
}

export function AddLabWorkForm() {
  const { state, formProps, pending } = useFormAction<FormState>(addLabWorkAction);
  return (
    <form {...formProps} className="space-y-2">
      <FormMessages state={state} />
      <SubmitButton pending={pending} variant="secondary">
        Add my Test Lab work
      </SubmitButton>
    </form>
  );
}

export function ReflectionForm() {
  const { state, formProps, pending } = useFormAction<FormState>(addReflectionAction, {} as FormState, { resetOnSuccess: true });
  return (
    <form {...formProps} className="space-y-2">
      <FormMessages state={state} />
      <label htmlFor="ref-title" className="block font-semibold">
        Title
      </label>
      <Input id="ref-title" name="title" maxLength={150} />
      <label htmlFor="ref-body" className="block font-semibold">
        Reflection
      </label>
      <Textarea id="ref-body" name="body" maxLength={5000} className="min-h-28" />
      <SubmitButton pending={pending} variant="secondary">
        Add reflection
      </SubmitButton>
    </form>
  );
}

export function ShareForm({ active }: { active: boolean }) {
  const { state, formProps, pending } = useFormAction<ShareState>(createShareAction);
  return (
    <form {...formProps} className="space-y-2">
      {state.link ? (
        <Alert tone="success" role="status">
          <p>{state.ok}</p>
          <label htmlFor="share-link" className="mt-2 block font-semibold">
            Your link
          </label>
          <Input id="share-link" readOnly value={state.link} className="font-mono text-sm" data-testid="share-link" />
        </Alert>
      ) : null}
      <SubmitButton pending={pending} variant="secondary">
        {active ? "Make a new link (turns off the old one)" : "Create a private link"}
      </SubmitButton>
    </form>
  );
}
