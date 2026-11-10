import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireLearner } from "@/server/guards";
import { assessmentOverview, getPublishedAssessment } from "@/server/assessments";
import { startAttemptAction } from "./actions";
import { Alert, Badge, Card, PageHeader } from "@/components/ui/card";
import { SubmitButton } from "@/components/forms/form-status";

export const metadata: Metadata = { title: "Assessment" };

export default async function AssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireLearner();
  const { slug } = await params;
  const { error } = await searchParams;
  const assessment = await getPublishedAssessment(slug);
  if (!assessment) notFound();
  const o = await assessmentOverview(assessment.id, assessment.cooldownMinutes, user.id);
  const submitted = o.attempts.filter((a) => a.submittedAt);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={assessment.title}>
        {assessment.module ? (
          <p>
            <Link href={`/pathways/${assessment.module.pathway.slug}/${assessment.module.slug}`}>Back to {assessment.module.title}</Link>
          </p>
        ) : null}
      </PageHeader>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Card className="space-y-3">
        <ul className="list-disc space-y-1 pl-5">
          <li>{assessment.drawCount} questions, chosen from a larger bank – each attempt gets a different set.</li>
          <li>The pass mark is {assessment.passMark}%. There&apos;s no time limit.</li>
          <li>You&apos;ll see an explanation for every answer afterwards, with links back to the lesson.</li>
          <li>You can try again as many times as you like{assessment.cooldownMinutes > 0 ? `, with a ${assessment.cooldownMinutes}-minute break between attempts` : ""}.</li>
        </ul>
        {!o.unlock.unlocked ? (
          <Alert tone="warning">
            <p className="font-semibold">Not unlocked yet. To unlock it:</p>
            <ul className="list-disc pl-5">
              {o.unlock.missing.map((m) => (
                <li key={m.requiredId + m.requirement}>{m.label}</li>
              ))}
            </ul>
          </Alert>
        ) : o.inProgress ? (
          <Link className="font-semibold" href={`/assessments/${slug}/attempt/${o.inProgress.id}`}>
            Continue your current attempt
          </Link>
        ) : o.cooldownLeft > 0 ? (
          <Alert>You can start another attempt in {o.cooldownLeft} minutes. Use the time to look back at the lessons.</Alert>
        ) : (
          <form action={startAttemptAction}>
            <input type="hidden" name="slug" value={slug} />
            <SubmitButton pendingText="Preparing your questions…">
              {submitted.length ? "Start a new attempt" : "Start the assessment"}
            </SubmitButton>
          </form>
        )}
      </Card>

      {submitted.length > 0 ? (
        <section aria-labelledby="history">
          <h2 id="history" className="text-xl font-bold">
            Your attempts
          </h2>
          <ul className="mt-3 space-y-2">
            {submitted.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3">
                <span>{a.submittedAt!.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
                <span className="font-semibold">{a.scorePercent}%</span>
                {a.passed ? <Badge tone="success">Passed</Badge> : <Badge tone="warning">Not passed yet</Badge>}
                <Link href={`/assessments/${slug}/attempt/${a.id}/result`}>See feedback</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
