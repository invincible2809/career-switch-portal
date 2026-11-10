import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireLearner } from "@/server/guards";
import { getOwnAttempt } from "@/server/assessments";
import { submitAttemptAction } from "../../actions";
import { toPublic } from "@/lib/assessment/snapshot";
import type { QuestionSnapshot } from "@/lib/assessment/types";
import { PageHeader } from "@/components/ui/card";
import { SubmitButton } from "@/components/forms/form-status";
import { QuestionInputs } from "@/components/quiz/question-inputs";

export const metadata: Metadata = { title: "Assessment attempt" };

export default async function AttemptPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const user = await requireLearner();
  const { slug, id } = await params;
  const attempt = await getOwnAttempt(user.id, id);
  if (!attempt || attempt.assessment.slug !== slug) notFound();
  if (attempt.submittedAt) redirect(`/assessments/${slug}/attempt/${id}/result`);
  const total = attempt.answers.length;

  return (
    <div className="max-w-3xl">
      <PageHeader title={attempt.assessment.title} intro={`Answer all ${total} questions, then submit. Take your time.`} />
      <form action={submitAttemptAction} className="space-y-5">
        <input type="hidden" name="attemptId" value={attempt.id} />
        {attempt.answers.map((a, i) => {
          const q = toPublic(a.snapshot as unknown as QuestionSnapshot);
          return (
            <fieldset key={a.id} className="space-y-3 rounded-lg border border-border bg-surface p-4" data-testid="assessment-question">
              <legend className="font-semibold">
                <span className="block text-sm text-muted">
                  Question {i + 1} of {total}
                </span>
                {q.scenario ? <span className="block font-normal">{q.scenario}</span> : null}
                {q.stem}
              </legend>
              <QuestionInputs q={q} prefix={`a_${a.id}`} />
            </fieldset>
          );
        })}
        <p className="text-muted">Unanswered questions are marked as incorrect.</p>
        <SubmitButton pendingText="Marking your answers…">Submit answers</SubmitButton>
      </form>
    </div>
  );
}
