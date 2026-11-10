"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { createDefectAction } from "@/app/lab/records/actions";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import type { FormState } from "@/lib/schemas/auth";
import { LAB_AREAS } from "@/lib/lab/spec";
import { PRIORITIES, SEVERITIES } from "@/lib/assignments/forms";

export function DefectForm() {
  const { state, formProps, pending } = useFormAction<FormState>(createDefectAction, {} as FormState, { resetOnSuccess: true });
  const fe = state.fieldErrors ?? {};
  return (
    <form {...formProps} className="space-y-4" noValidate>
      <FormMessages state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="df-area" label="Area" error={fe.area}>
          {(a) => (
            <Select {...a} name="area" defaultValue="">
              <option value="">Choose…</option>
              {LAB_AREAS.map((x) => (
                <option key={x} value={x}>
                  {x.charAt(0).toUpperCase() + x.slice(1)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="df-environment" label="Environment" error={fe.environment}>
          {(a) => <Input {...a} name="environment" maxLength={200} defaultValue="Test Lab demo shop, " />}
        </Field>
      </div>
      <Field id="df-title" label="Title" error={fe.title}>
        {(a) => <Input {...a} name="title" maxLength={200} />}
      </Field>
      <Field id="df-steps" label="Steps to reproduce" error={fe.steps}>
        {(a) => <Textarea {...a} name="steps" maxLength={1500} className="min-h-20" />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="df-expected" label="Expected result" error={fe.expected}>
          {(a) => <Textarea {...a} name="expected" maxLength={800} className="min-h-16" />}
        </Field>
        <Field id="df-actual" label="Actual result" error={fe.actual}>
          {(a) => <Textarea {...a} name="actual" maxLength={800} className="min-h-16" />}
        </Field>
        <Field id="df-severity" label="Severity" error={fe.severity}>
          {(a) => (
            <Select {...a} name="severity" defaultValue="">
              <option value="">Choose…</option>
              {SEVERITIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="df-priority" label="Priority" error={fe.priority}>
          {(a) => (
            <Select {...a} name="priority" defaultValue="">
              <option value="">Choose…</option>
              {PRIORITIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field id="df-evidence" label="Evidence (optional)" hint="For example, what was on screen. Don't include real personal data.">
        {(a) => <Input {...a} name="evidence" maxLength={500} />}
      </Field>
      <SubmitButton pending={pending}>Save defect report</SubmitButton>
    </form>
  );
}
