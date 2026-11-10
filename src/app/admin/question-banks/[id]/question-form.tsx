"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { saveQuestionAction } from "../../actions";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import type { FormState } from "@/lib/schemas/auth";
import { LESSON_PARTS } from "@/lib/content/lesson-parts";

export interface QuestionFormValues {
  key: string;
  type: string;
  scenario: string;
  stem: string;
  options: { text: string; correct: boolean; explanation: string }[];
  correctOrder: string;
  objective: string;
  lessonSlug: string;
  sectionKey: string;
  tags: string;
  isKey: boolean;
}

export function QuestionForm({ bankId, values, lessons, idPrefix }: { bankId: string; values: QuestionFormValues; lessons: { slug: string; title: string }[]; idPrefix: string }) {
  const { state, formProps, pending } = useFormAction<FormState>(saveQuestionAction);
  const p = (s: string) => `${idPrefix}-${s}`;
  const rows = [0, 1, 2, 3, 4, 5].map((i) => values.options[i] ?? { text: "", correct: false, explanation: "" });
  return (
    <form {...formProps} className="space-y-4" noValidate>
      <FormMessages state={state} />
      <input type="hidden" name="bankId" value={bankId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={p("key")} label="Question key" hint="Stays the same across versions">
          {(a) => <Input {...a} name="key" defaultValue={values.key} readOnly={!!values.key} required />}
        </Field>
        <Field id={p("type")} label="Type">
          {(a) => (
            <Select {...a} name="type" defaultValue={values.type || "SINGLE"}>
              <option value="SINGLE">Single choice</option>
              <option value="SCENARIO">Scenario</option>
              <option value="MULTI">Multiple select</option>
              <option value="ORDER">Ordering</option>
            </Select>
          )}
        </Field>
      </div>
      <Field id={p("scenario")} label="Scenario (for scenario questions)">
        {(a) => <Textarea {...a} name="scenario" defaultValue={values.scenario} className="min-h-16" />}
      </Field>
      <Field id={p("stem")} label="Question">
        {(a) => <Textarea {...a} name="stem" defaultValue={values.stem} className="min-h-16" required />}
      </Field>
      <fieldset className="space-y-3">
        <legend className="font-semibold">Options (a–f). Every option needs an explanation. Leave unused rows empty.</legend>
        {rows.map((o, i) => (
          <div key={i} className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[2rem_1fr_1fr_auto] sm:items-start">
            <span className="font-bold" aria-hidden="true">
              {"abcdef"[i]}
            </span>
            <div>
              <label htmlFor={p(`opt_${i}_text`)} className="text-sm font-semibold">
                Option {"abcdef"[i]} text
              </label>
              <Input id={p(`opt_${i}_text`)} name={`opt_${i}_text`} defaultValue={o.text} />
            </div>
            <div>
              <label htmlFor={p(`opt_${i}_explanation`)} className="text-sm font-semibold">
                Option {"abcdef"[i]} explanation
              </label>
              <Textarea id={p(`opt_${i}_explanation`)} name={`opt_${i}_explanation`} defaultValue={o.explanation} className="min-h-16" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={`opt_${i}_correct`} defaultChecked={o.correct} className="h-5 w-5" />
              Correct
            </label>
          </div>
        ))}
      </fieldset>
      <Field id={p("correctOrder")} label="Correct order (ordering questions only)" hint="Option letters separated by commas, for example: b, a, d, c">
        {(a) => <Input {...a} name="correctOrder" defaultValue={values.correctOrder} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id={p("objective")} label="Objective it checks">
          {(a) => <Input {...a} name="objective" defaultValue={values.objective} required />}
        </Field>
        <Field id={p("lessonSlug")} label="Remediation lesson">
          {(a) => (
            <Select {...a} name="lessonSlug" defaultValue={values.lessonSlug}>
              {lessons.map((l) => (
                <option key={l.slug} value={l.slug}>
                  {l.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id={p("sectionKey")} label="Lesson section">
          {(a) => (
            <Select {...a} name="sectionKey" defaultValue={values.sectionKey || "explanation"}>
              {LESSON_PARTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field id={p("tags")} label="Tags (optional)" hint="Separated by commas">
        {(a) => <Input {...a} name="tags" defaultValue={values.tags} />}
      </Field>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isKey" defaultChecked={values.isKey} className="h-5 w-5" />
        Key question (always included in spaced review)
      </label>
      <SubmitButton pending={pending} variant="secondary">Save as draft</SubmitButton>
    </form>
  );
}
