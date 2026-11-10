"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { interviewAnswerAction, type InterviewState } from "@/app/coach/actions";
import { Textarea } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import { Alert } from "@/components/ui/card";
import { CoachLabel } from "./coach-label";

export function InterviewForm({ questionId, question, outline }: { questionId: string; question: string; outline: string }) {
  const { state, formProps, pending } = useFormAction<InterviewState>(interviewAnswerAction);
  const f = state.feedback && state.questionId === questionId ? state.feedback : null;
  return (
    <div className="space-y-4">
      <form {...formProps} className="space-y-3">
        {state.error ? <FormMessages state={{ error: state.error }} /> : null}
        <input type="hidden" name="questionId" value={questionId} />
        <label htmlFor="interview-answer" className="block font-semibold">
          Your answer to: {question}
        </label>
        <Textarea id="interview-answer" name="answer" maxLength={3000} className="min-h-40" />
        <SubmitButton pending={pending} pendingText="Checking…">
          Get feedback
        </SubmitButton>
      </form>
      {f ? (
        <section aria-label="Feedback" role="status" className="space-y-2 rounded-md border border-border bg-surface p-4" data-testid="interview-feedback">
          <CoachLabel />
          <p>
            <strong>Covered:</strong> {f.covered.length ? f.covered.join("; ") : "none of the key points yet"}
          </p>
          {f.missing.length ? (
            <p>
              <strong>Not covered yet:</strong> {f.missing.join("; ")}
            </p>
          ) : null}
          <ul className="list-disc pl-5">
            {f.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <details>
            <summary className="cursor-pointer font-semibold text-primary">Show a model outline</summary>
            <p className="mt-1">{outline}</p>
          </details>
          <Alert className="text-sm">This checks which key points you mentioned. It can&apos;t judge how convincing you sound – practise out loud with a friend too.</Alert>
        </section>
      ) : null}
    </div>
  );
}
