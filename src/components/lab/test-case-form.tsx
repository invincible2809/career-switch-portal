"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { createTestCaseAction } from "@/app/lab/records/actions";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import type { FormState } from "@/lib/schemas/auth";

export function TestCaseForm() {
  const { state, formProps, pending } = useFormAction<FormState>(createTestCaseAction, {} as FormState, { resetOnSuccess: true });
  const fe = state.fieldErrors ?? {};
  return (
    <form {...formProps} className="space-y-4" noValidate>
      <FormMessages state={state} />
      <Field id="tc-title" label="Title" error={fe.title}>
        {(a) => <Input {...a} name="title" maxLength={200} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="tc-technique" label="Technique" error={fe.technique}>
          {(a) => (
            <Select {...a} name="technique" defaultValue="">
              <option value="">Choose…</option>
              <option value="EP">Equivalence partitioning</option>
              <option value="BVA">Boundary value analysis</option>
              <option value="OTHER">Other</option>
            </Select>
          )}
        </Field>
        <Field id="tc-testData" label="Test data" error={fe.testData}>
          {(a) => <Input {...a} name="testData" maxLength={300} />}
        </Field>
      </div>
      <Field id="tc-preconditions" label="Preconditions (optional)" hint="For example: logged in, basket empty">
        {(a) => <Input {...a} name="preconditions" maxLength={500} />}
      </Field>
      <Field id="tc-steps" label="Steps" error={fe.steps}>
        {(a) => <Textarea {...a} name="steps" maxLength={1500} className="min-h-20" />}
      </Field>
      <Field id="tc-expected" label="Expected result" error={fe.expected}>
        {(a) => <Textarea {...a} name="expected" maxLength={800} className="min-h-16" />}
      </Field>
      <SubmitButton pending={pending}>Save test case</SubmitButton>
    </form>
  );
}
