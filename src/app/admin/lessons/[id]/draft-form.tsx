"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { saveDraftAction } from "../../actions";
import { Field, Input, Textarea } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import type { FormState } from "@/lib/schemas/auth";
import type { LessonSection } from "@/lib/content/lesson-parts";

export function DraftForm({
  versionId,
  title,
  estimatedMinutes,
  objectives,
  knowledgeCheck,
  sections,
  partLabels,
}: {
  versionId: string;
  title: string;
  estimatedMinutes: number;
  objectives: string[];
  knowledgeCheck: string;
  sections: LessonSection[];
  partLabels: Record<string, string>;
}) {
  const { state, formProps, pending } = useFormAction<FormState>(saveDraftAction);
  const fe = state.fieldErrors ?? {};
  return (
    <form {...formProps} className="space-y-5" noValidate>
      <FormMessages state={state} />
      <input type="hidden" name="versionId" value={versionId} />
      <Field id="title" label="Lesson title" error={fe.title}>
        {(a) => <Input {...a} name="title" defaultValue={title} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="estimatedMinutes" label="Estimated minutes" error={fe.estimatedMinutes}>
          {(a) => <Input {...a} name="estimatedMinutes" type="number" min={5} max={40} defaultValue={estimatedMinutes} />}
        </Field>
        <Field id="knowledgeCheck" label="Knowledge check question bank (slug)" error={fe.knowledgeCheck}>
          {(a) => <Input {...a} name="knowledgeCheck" defaultValue={knowledgeCheck} />}
        </Field>
      </div>
      <Field id="objectives" label="Learning objectives" hint="One per line" error={fe.objectives}>
        {(a) => <Textarea {...a} name="objectives" defaultValue={objectives.join("\n")} className="min-h-20" />}
      </Field>
      <p className="text-sm text-muted">
        Markdown is supported. Use <code>[[term]]</code> to link to the glossary and <code>:::hint</code> … <code>:::</code> for hints.
      </p>
      {sections.map((s, i) => (
        <fieldset key={s.key} className="space-y-3 rounded-md border border-border p-4">
          <legend className="px-1 font-bold">
            Part {i + 1}: {partLabels[s.key]}
          </legend>
          <Field id={`title_${s.key}`} label="Heading" error={fe[`title_${s.key}`]}>
            {(a) => <Input {...a} name={`title_${s.key}`} defaultValue={s.title} />}
          </Field>
          <Field id={`section_${s.key}`} label="Content" error={fe[`section_${s.key}`]}>
            {(a) => <Textarea {...a} name={`section_${s.key}`} defaultValue={s.markdown} className="min-h-40 font-mono text-sm" />}
          </Field>
        </fieldset>
      ))}
      <SubmitButton pending={pending} pendingText="Saving…">Save draft</SubmitButton>
    </form>
  );
}
