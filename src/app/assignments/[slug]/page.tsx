import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { unlockState } from "@/server/learning";
import { getPublishedAssignment } from "@/server/assignments/service";
import { renderMarkdown } from "@/lib/lesson/markdown";
import type { MinimumRule } from "@/lib/assignments/evaluate";
import { Alert, Badge, Card, PageHeader } from "@/components/ui/card";
import { RubricTable } from "@/components/assignments/rubric-table";
import { QaMaterials } from "@/components/assignments/qa-materials";
import { QaCheckoutForm, ScrumRetroPlanForm } from "@/components/assignments/submission-forms";

export const metadata: Metadata = { title: "Practical assignment" };

export default async function AssignmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireLearner();
  const { slug } = await params;
  const a = await getPublishedAssignment(slug);
  if (!a) notFound();
  const [unlock, submissions] = await Promise.all([
    unlockState("ASSIGNMENT", a.id, user.id),
    db.submission.findMany({ where: { userId: user.id, assignmentId: a.id }, orderBy: { submittedAt: "desc" }, include: { competency: true } }),
  ]);
  const criteria = a.rubric.criteria.map((c) => ({ key: c.key, title: c.title }));
  const minEach = (a.rubric.minimumRule as unknown as MinimumRule).minEach;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title={a.title}>
        <p>
          <Link href={`/pathways/${a.module.pathway.slug}/${a.module.slug}`}>Back to {a.module.title}</Link>
        </p>
      </PageHeader>
      <Alert>
        <strong>Simulated learning project – not paid work experience.</strong> ShopEasy and its team are fictional.
      </Alert>

      <Card className="space-y-4">
        <h2 className="text-xl font-bold">The brief</h2>
        <div className="prose-lesson" dangerouslySetInnerHTML={{ __html: renderMarkdown(a.briefMarkdown) }} />
        {a.formKind === "QA_CHECKOUT_TESTING" ? <QaMaterials /> : null}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-bold">How it&apos;s assessed</h2>
        <RubricTable criteria={a.rubric.criteria} minEach={minEach} />
      </Card>

      {submissions.length > 0 ? (
        <Card>
          <h2 className="text-xl font-bold">Your submissions</h2>
          <ul className="mt-2 space-y-2">
            {submissions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3">
                <Link href={`/assignments/${slug}/submissions/${s.id}`}>
                  {s.submittedAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </Link>
                {s.competency ? (
                  <Badge tone="success">Competency demonstrated</Badge>
                ) : s.assessmentState === "AWAITING_REVIEW" ? (
                  <Badge tone="primary">Awaiting assessor review</Badge>
                ) : (
                  <Badge tone="warning">Not yet demonstrated</Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {!unlock.unlocked ? (
        <Alert tone="warning">
          <p className="font-semibold">Not unlocked yet. To unlock it:</p>
          <ul className="list-disc pl-5">
            {unlock.missing.map((m) => (
              <li key={m.requiredId}>{m.label}</li>
            ))}
          </ul>
        </Alert>
      ) : (
        <Card className="space-y-3">
          <h2 className="text-xl font-bold">{submissions.length ? "Submit a new version" : "Your work"}</h2>
          {a.formKind === "SCRUM_RETRO_PLAN" ? <ScrumRetroPlanForm slug={slug} criteria={criteria} /> : <QaCheckoutForm slug={slug} criteria={criteria} />}
        </Card>
      )}
    </div>
  );
}
