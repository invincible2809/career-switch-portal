import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireLearner } from "@/server/guards";
import { getOwnSubmission } from "@/server/assignments/service";
import { QA_KNOWN_DEFECTS } from "@/server/assignments/qa-known-defects";
import { evaluateRubric, type MinimumRule } from "@/lib/assignments/evaluate";
import { matchDefects } from "@/lib/assignments/checks";
import { SESSION_LOG } from "@/lib/assignments/qa-session-log";
import type { QaCheckout } from "@/lib/assignments/forms";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { SubmissionAnswers } from "@/components/assignments/submission-answers";

export const metadata: Metadata = { title: "Assignment feedback" };

export default async function SubmissionPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const user = await requireLearner();
  const { slug, id } = await params;
  const s = await getOwnSubmission(user.id, id);
  if (!s || s.assignment.slug !== slug) notFound();
  const criteria = s.assignment.rubric.criteria;
  const rule = s.assignment.rubric.minimumRule as unknown as MinimumRule;
  const e = evaluateRubric(
    criteria.map((c) => c.id),
    s.scores.map((x) => ({ criterionId: x.criterionId, score: x.score, source: x.source, createdAt: x.createdAt })),
    rule,
  );
  const latest = (cid: string, source: "SELF" | "AUTOMATED" | "ASSESSOR") =>
    s.scores.filter((x) => x.criterionId === cid && x.source === source).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  const qa = s.assignment.formKind === "QA_CHECKOUT_TESTING" ? matchDefects(s.payload as unknown as QaCheckout, QA_KNOWN_DEFECTS, SESSION_LOG.length) : null;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title={`${s.assignment.title}: feedback`}>
        <p>
          Submitted {s.submittedAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
          <Link href={`/assignments/${slug}`}>Back to the assignment</Link>
        </p>
      </PageHeader>

      <Card className="space-y-2" data-testid="competency-status">
        {s.competency ? (
          <Alert tone="success">
            <strong>Competency demonstrated.</strong>{" "}
            {s.competency.assessedBy === "ASSESSOR" ? "Reviewed by an assessor." : "Automated guidance from course content – not reviewed by a person."}
          </Alert>
        ) : !e.complete ? (
          <Alert>
            <strong>Awaiting assessor review.</strong> The automated checks are done. An assessor still needs to score{" "}
            {e.awaiting.length} criterion{e.awaiting.length === 1 ? "" : "s"}. Submitting work doesn&apos;t count as
            mastery on its own.
          </Alert>
        ) : (
          <Alert tone="warning">
            <strong>Competency not yet demonstrated.</strong> Every criterion needs a score of at least {rule.minEach}. Look
            at the feedback below, then submit a new version whenever you&apos;re ready.
          </Alert>
        )}
        <p className="text-sm text-muted">Simulated learning project – not paid work experience.</p>
      </Card>

      <section aria-labelledby="scores-h" className="space-y-3">
        <h2 id="scores-h" className="text-xl font-bold">
          Scores against the rubric
        </h2>
        {criteria.map((c) => {
          const off = e.official.get(c.id);
          const auto = latest(c.id, "AUTOMATED");
          const assessor = latest(c.id, "ASSESSOR");
          const self = latest(c.id, "SELF");
          const d = c.descriptors as Record<string, string>;
          return (
            <Card key={c.id} className="space-y-2" data-testid={`criterion-${c.key}`}>
              <h3 className="font-bold">{c.title}</h3>
              <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[12rem_1fr]">
                <dt className="font-semibold">Official score</dt>
                <dd>
                  {off ? (
                    <>
                      <strong>{off.score} out of 3</strong> – {d[String(off.score)]}{" "}
                      <span className="text-muted">
                        ({off.source === "ASSESSOR" ? "scored by an assessor" : "automated guidance from course content – not reviewed by a person"})
                      </span>
                      {off.score < rule.minEach ? <span className="block font-semibold text-warning">Below the minimum of {rule.minEach}.</span> : null}
                    </>
                  ) : (
                    "Awaiting assessor review"
                  )}
                </dd>
                <dt className="font-semibold">Your self-assessment</dt>
                <dd>{self ? `${self.score} out of 3 (doesn't count towards competency)` : "Not given"}</dd>
              </dl>
              {auto?.comment ? (
                <div>
                  <p className="font-semibold">Automated check</p>
                  <ul className="list-disc pl-5 text-sm">
                    {auto.comment.split("\n").map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {assessor?.comment ? (
                <p>
                  <span className="font-semibold">Assessor&apos;s comment{assessor.scoredBy ? ` (${assessor.scoredBy.displayName})` : ""}:</span>{" "}
                  {assessor.comment}
                </p>
              ) : null}
            </Card>
          );
        })}
      </section>

      {qa ? (
        <Card className="space-y-2">
          <h2 className="text-xl font-bold">The defects in the session log</h2>
          <p>Now that you&apos;ve submitted, here is the full list. You found {qa.found} clearly and described {qa.partly} in part.</p>
          <ul className="list-disc space-y-1 pl-5">
            {QA_KNOWN_DEFECTS.map((d) => (
              <li key={d.key}>
                Entry {d.logEntry}: {d.summary}{" "}
                <strong>{qa.missed.some((m) => m.key === d.key) ? "– missed" : "– reported"}</strong>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">Every other log entry shows the checkout working as the specification says.</p>
        </Card>
      ) : null}

      <Card>
        <h2 className="text-xl font-bold">What you submitted</h2>
        <SubmissionAnswers formKind={s.assignment.formKind} payload={s.payload} />
      </Card>
    </div>
  );
}
