import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { Badge, PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Submissions – Admin" };

export default async function SubmissionsPage() {
  await requireAdmin("submissions:assess");
  const submissions = await db.submission.findMany({
    orderBy: [{ assessmentState: "asc" }, { submittedAt: "asc" }],
    take: 200,
    include: { assignment: { select: { title: true } }, user: { select: { displayName: true } }, competency: true },
  });
  const waiting = submissions.filter((s) => s.assessmentState === "AWAITING_REVIEW").length;
  return (
    <div>
      <PageHeader title="Practical submissions" intro={`${waiting} waiting for assessor review. Oldest first.`} />
      {submissions.length === 0 ? <p>No submissions yet.</p> : null}
      <ul className="space-y-2" data-testid="submission-list">
        {submissions.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface p-3">
            <Link href={`/admin/submissions/${s.id}`} className="font-semibold">
              {s.assignment.title} – {s.user.displayName}
            </Link>
            <span className="text-sm text-muted">{s.submittedAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
            {s.assessmentState === "AWAITING_REVIEW" ? <Badge tone="primary">Awaiting review</Badge> : null}
            {s.competency ? <Badge tone="success">Competency demonstrated</Badge> : s.assessmentState === "ASSESSED" ? <Badge tone="warning">Not demonstrated</Badge> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
