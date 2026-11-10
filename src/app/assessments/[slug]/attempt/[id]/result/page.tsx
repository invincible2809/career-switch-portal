import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { getOwnAttempt } from "@/server/assessments";
import type { QuestionSnapshot } from "@/lib/assessment/types";
import { LESSON_PARTS } from "@/lib/content/lesson-parts";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Assessment feedback" };

export default async function ResultPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const user = await requireLearner();
  const { slug, id } = await params;
  const attempt = await getOwnAttempt(user.id, id);
  if (!attempt || attempt.assessment.slug !== slug) notFound();
  if (!attempt.submittedAt) redirect(`/assessments/${slug}/attempt/${id}`);

  const items = attempt.answers.map((a) => ({
    snapshot: a.snapshot as unknown as QuestionSnapshot,
    response: (a.response as string[] | null) ?? [],
    correct: !!a.correct,
  }));
  const correctCount = items.filter((i) => i.correct).length;
  const missed = items.filter((i) => !i.correct);

  // Remediation: the exact lesson sections behind the missed questions.
  const lessonSlugs = [...new Set(missed.map((m) => m.snapshot.lessonRef.lessonSlug))];
  const lessons = await db.lesson.findMany({
    where: { slug: { in: lessonSlugs } },
    select: { slug: true, publishedVersion: { select: { title: true } } },
  });
  const lessonTitle = (s: string) => lessons.find((l) => l.slug === s)?.publishedVersion?.title ?? s;
  const partLabel = (k: string) => LESSON_PARTS.find((p) => p.key === k)?.label ?? k;
  const remediation = [
    ...new Map(missed.map((m) => [`${m.snapshot.lessonRef.lessonSlug}#${m.snapshot.lessonRef.sectionKey}`, m.snapshot.lessonRef])).values(),
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={`${attempt.assessment.title}: your feedback`} />
      <Card className="space-y-2" data-testid="score-summary">
        <p className="text-2xl font-bold">
          You scored {attempt.scorePercent}% ({correctCount} out of {items.length})
        </p>
        {attempt.passed ? (
          <Alert tone="success">
            <strong>Passed.</strong> The pass mark for this attempt was {attempt.passMarkAtStart}%. Well done.
          </Alert>
        ) : (
          <Alert tone="warning">
            <strong>Not passed yet.</strong> The pass mark for this attempt was {attempt.passMarkAtStart}%. That&apos;s
            fine – most people need more than one go. Look at the explanations below, revisit the sections linked, then
            try again. You&apos;ll get a different set of questions.
          </Alert>
        )}
      </Card>

      {remediation.length > 0 ? (
        <Card>
          <h2 className="text-xl font-bold">Recommended before you try again</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5" data-testid="remediation-links">
            {remediation.map((r) => (
              <li key={`${r.lessonSlug}-${r.sectionKey}`}>
                <Link href={`/learn/${r.lessonSlug}?section=${r.sectionKey}`}>
                  {lessonTitle(r.lessonSlug)} – {partLabel(r.sectionKey)}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted">
            The questions you missed have also been added to your <Link href="/review">quick review</Link> for extra
            practice.
          </p>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link href={`/assessments/${slug}`} className={buttonVariants({ variant: attempt.passed ? "secondary" : "primary" })}>
          {attempt.passed ? "Back to the assessment" : "Try again with different questions"}
        </Link>
        <Link href="/dashboard" className={buttonVariants({ variant: "secondary" })}>
          Go to dashboard
        </Link>
      </div>

      <section aria-labelledby="answers" className="space-y-4">
        <h2 id="answers" className="text-xl font-bold">
          Every question explained
        </h2>
        {items.map((item, i) => {
          const s = item.snapshot;
          const chosen = new Set(item.response);
          return (
            <Card key={i} className="space-y-2" data-testid="feedback-question">
              <p className="text-sm text-muted">Question {i + 1}</p>
              {s.scenario ? <p>{s.scenario}</p> : null}
              <p className="font-semibold">{s.stem}</p>
              <p className={item.correct ? "font-bold text-success" : "font-bold text-warning"}>
                {item.correct ? "✓ You got this right" : item.response.length ? "✗ Not quite" : "✗ Not answered"}
              </p>
              {s.type === "ORDER" ? (
                <div className="space-y-1">
                  <p>
                    <strong>Correct order:</strong> {s.correctOrder.map((oid) => s.options.find((o) => o.id === oid)?.text).join(" → ")}
                  </p>
                  {item.response.length ? (
                    <p>
                      <strong>Your order:</strong> {item.response.map((oid) => s.options.find((o) => o.id === oid)?.text).join(" → ")}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <ul className="space-y-1">
                {s.options.map((o) => (
                  <li key={o.id} className={s.type !== "ORDER" && chosen.has(o.id) ? "rounded bg-surface-muted p-1" : "p-1"}>
                    <strong>
                      {o.text}
                      {s.type !== "ORDER" ? (o.correct ? " (correct answer)" : "") : ""}
                      {s.type !== "ORDER" && chosen.has(o.id) ? " – your answer" : ""}:
                    </strong>{" "}
                    {o.explanation}
                  </li>
                ))}
              </ul>
              {!item.correct ? (
                <p className="text-sm">
                  <Link href={`/learn/${s.lessonRef.lessonSlug}?section=${s.lessonRef.sectionKey}`}>
                    Revisit: {lessonTitle(s.lessonRef.lessonSlug)} – {partLabel(s.lessonRef.sectionKey)}
                  </Link>
                </p>
              ) : null}
            </Card>
          );
        })}
      </section>
    </div>
  );
}
