import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { Card, PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminHome() {
  await requireAdmin();
  const [learners, lessons, drafts, inReview, questionDrafts, attempts] = await Promise.all([
    db.user.count({ where: { role: "LEARNER" } }),
    db.lesson.count({ where: { publishedVersionId: { not: null } } }),
    db.lessonVersion.count({ where: { status: "DRAFT" } }),
    db.lessonVersion.count({ where: { status: "IN_REVIEW" } }),
    db.question.count({ where: { draft: true } }),
    db.assessmentAttempt.count({ where: { submittedAt: { not: null } } }),
  ]);
  const stats = [
    ["Learners", learners],
    ["Published lessons", lessons],
    ["Lesson drafts", drafts],
    ["Lessons waiting for review", inReview],
    ["Draft question changes", questionDrafts],
    ["Assessment attempts", attempts],
  ] as const;
  return (
    <div>
      <PageHeader title="Admin overview" intro="Totals across the whole portal. Individual learner data is only shown where it's needed." />
      <dl className="grid gap-4 sm:grid-cols-3">
        {stats.map(([label, n]) => (
          <Card key={label}>
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-3xl font-bold">{n}</dd>
          </Card>
        ))}
      </dl>
      <p className="mt-6">
        Start with the <Link href="/admin/curriculum">curriculum</Link> to edit lessons, or{" "}
        <Link href="/admin/assessments">assessments</Link> to change pass marks.
      </p>
    </div>
  );
}
