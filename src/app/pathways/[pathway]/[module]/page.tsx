import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { publishedLessons, unlockState } from "@/server/learning";
import { Alert, Badge, Card, PageHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Module" };

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ pathway: string; module: string }>;
  searchParams: Promise<{ completed?: string }>;
}) {
  const user = await requireLearner();
  const { pathway: pathwaySlug, module: moduleSlug } = await params;
  const { completed } = await searchParams;
  const mod = await db.module.findUnique({
    where: { slug: moduleSlug },
    include: { pathway: true, assessments: { where: { status: "PUBLISHED" } }, assignments: { where: { status: "PUBLISHED" } } },
  });
  if (!mod || mod.pathway.slug !== pathwaySlug || mod.status !== "PUBLISHED" || mod.availability !== "AVAILABLE") notFound();

  const lessons = await publishedLessons(mod.id);
  const progress = await db.lessonProgress.findMany({ where: { userId: user.id, lessonId: { in: lessons.map((l) => l.id) } } });
  const byLesson = new Map(progress.map((p) => [p.lessonId, p]));
  const assessments = await Promise.all(
    mod.assessments.map(async (a) => ({
      a,
      unlock: await unlockState("ASSESSMENT", a.id, user.id),
      status: await db.assessmentStatus.findUnique({ where: { userId_assessmentId: { userId: user.id, assessmentId: a.id } } }),
    })),
  );
  const assignments = await Promise.all(
    mod.assignments.map(async (a) => ({
      a,
      unlock: await unlockState("ASSIGNMENT", a.id, user.id),
      competency: await db.competency.findFirst({ where: { userId: user.id, assignmentId: a.id } }),
      submitted: await db.submission.count({ where: { userId: user.id, assignmentId: a.id } }),
    })),
  );
  const justCompleted = completed ? lessons.find((l) => l.slug === completed) : null;
  const nextLesson = lessons.find((l) => !byLesson.get(l.id)?.contentCompletedAt);

  return (
    <div className="space-y-6">
      <PageHeader title={mod.title} intro={mod.summary}>
        <p>
          <Link href={`/pathways/${mod.pathway.slug}`}>{mod.pathway.title}</Link>
        </p>
      </PageHeader>
      {justCompleted ? (
        <Alert tone="success" role="status">
          You finished &quot;{justCompleted.publishedVersion?.title}&quot;.{" "}
          {nextLesson ? (
            <Link href={`/learn/${nextLesson.slug}`}>Next lesson: {nextLesson.publishedVersion?.title}</Link>
          ) : (
            "You've finished every lesson in this module."
          )}
        </Alert>
      ) : null}

      <section aria-labelledby="lessons">
        <h2 id="lessons" className="text-xl font-bold">
          Lessons
        </h2>
        {lessons.length === 0 ? <p className="text-muted">Lessons for this module are being written.</p> : null}
        <ol className="mt-3 space-y-3">
          {lessons.map((l, i) => {
            const p = byLesson.get(l.id);
            return (
              <li key={l.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold">
                      <Link href={`/learn/${l.slug}`}>
                        {i + 1}. {l.publishedVersion?.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-muted">About {l.publishedVersion?.estimatedMinutes} minutes</p>
                  </div>
                  {p?.contentCompletedAt ? (
                    <Badge tone="success">Finished</Badge>
                  ) : p ? (
                    <Badge tone="primary">In progress</Badge>
                  ) : (
                    <Badge>Not started</Badge>
                  )}
                </Card>
              </li>
            );
          })}
        </ol>
      </section>

      {assessments.map(({ a, unlock, status }) => (
        <Card key={a.id} className="space-y-2">
          <h2 className="text-xl font-bold">{a.title}</h2>
          {status?.passedAt ? (
            <Badge tone="success">Passed – best score {status.bestScore}%</Badge>
          ) : status ? (
            <Badge tone="warning">Best so far {status.bestScore}%</Badge>
          ) : null}
          {unlock.unlocked ? (
            <p>
              <Link href={`/assessments/${a.slug}`} className={buttonVariants({ variant: "secondary" })}>
                {status ? "Go to the assessment" : "Take the assessment"}
              </Link>
            </p>
          ) : (
            <div>
              <p className="font-semibold">Unlocks when you:</p>
              <ul className="list-disc pl-5">
                {unlock.missing.map((m) => (
                  <li key={m.requiredId + m.requirement}>{m.label}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      ))}

      {assignments.map(({ a, unlock, competency, submitted }) => (
        <Card key={a.id} className="space-y-2">
          <h2 className="text-xl font-bold">Practical assignment: {a.title}</h2>
          <p className="text-sm text-muted">Simulated learning project – not paid work experience.</p>
          {competency ? <Badge tone="success">Competency demonstrated</Badge> : submitted ? <Badge tone="primary">Submitted</Badge> : null}
          {unlock.unlocked ? (
            <p>
              <Link href={`/assignments/${a.slug}`} className={buttonVariants({ variant: "secondary" })}>
                {submitted ? "Go to the assignment" : "Start the assignment"}
              </Link>
            </p>
          ) : (
            <div>
              <p className="font-semibold">Unlocks when you:</p>
              <ul className="list-disc pl-5">
                {unlock.missing.map((m) => (
                  <li key={m.requiredId + m.requirement}>{m.label}</li>
                ))}
              </ul>
              <p className="mt-1">
                <Link href={`/assignments/${a.slug}`}>Read the brief now</Link>
              </p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
