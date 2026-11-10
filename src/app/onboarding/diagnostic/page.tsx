import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/guards";
import { getDiagnosticQuestions } from "@/server/onboarding";
import { submitDiagnosticAction } from "../actions";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { SubmitButton } from "@/components/forms/form-status";

export const metadata: Metadata = { title: "Getting to know you" };

export default async function DiagnosticPage() {
  const user = await requireUser();
  if (!user.profile?.preferredPathway) redirect("/onboarding");
  const questions = await getDiagnosticQuestions();
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Getting to know you"
        intro={`${questions.length} short questions. This is not a test you can fail – it helps us suggest where to start.`}
      />
      <Alert className="mb-6">
        There&apos;s no time limit. If you don&apos;t know an answer, choose &quot;I&apos;m not sure&quot; where it&apos;s
        offered, or skip the question.
      </Alert>
      <form action={submitDiagnosticAction} className="space-y-5">
        {questions.map((q, i) => (
          <Card key={q.id}>
            <fieldset>
              <legend className="font-semibold">
                <span className="text-muted">Question {i + 1} of {questions.length}. </span>
                {q.scenario ? <span className="block font-normal">{q.scenario}</span> : null}
                {q.stem}
              </legend>
              <div className="mt-3 space-y-2">
                {q.options.map((o) => (
                  <label key={o.id} className="flex items-start gap-3">
                    <input type="radio" name={`q_${q.id}`} value={o.id} className="mt-1 h-5 w-5" />
                    <span>{o.text}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </Card>
        ))}
        <SubmitButton pendingText="Working out your plan…">See my recommendation</SubmitButton>
      </form>
    </div>
  );
}
