import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { lessonSections } from "@/server/learning";
import { LESSON_PARTS } from "@/lib/content/lesson-parts";
import { Alert, Badge, Card, PageHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/forms/form-status";
import { Flash, type FlashParams } from "@/components/admin/flash";
import { discardDraftAction, publishVersionAction, startDraftAction, submitForReviewAction } from "../../actions";
import { DraftForm } from "./draft-form";

export const metadata: Metadata = { title: "Lesson – Admin" };

export default async function AdminLessonPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: FlashParams }) {
  await requireAdmin("content:edit");
  const { id } = await params;
  const flash = await searchParams;
  const lesson = await db.lesson.findUnique({
    where: { id },
    include: { module: true, versions: { orderBy: { version: "desc" }, include: { author: { select: { displayName: true } } } } },
  });
  if (!lesson) notFound();
  const draft = lesson.versions.find((v) => v.status === "DRAFT" || v.status === "IN_REVIEW");
  const published = lesson.versions.find((v) => v.id === lesson.publishedVersionId);
  const partLabels = Object.fromEntries(LESSON_PARTS.map((p) => [p.key, p.label]));

  return (
    <div className="space-y-6">
      <PageHeader title={draft?.title ?? published?.title ?? lesson.slug}>
        <p>
          <Link href={`/admin/modules/${lesson.moduleId}`}>Back to {lesson.module.title}</Link>
          {published ? (
            <>
              {" · "}
              <Link href={`/learn/${lesson.slug}`}>View as a learner</Link>
            </>
          ) : null}
        </p>
      </PageHeader>
      <Flash {...flash} />
      {lesson.reviewDueAt ? (
        <p className="text-sm text-muted">Content review due: {lesson.reviewDueAt.toLocaleDateString("en-GB")}</p>
      ) : null}

      <Card>
        <h2 className="text-xl font-bold">Versions</h2>
        <ul className="mt-2 space-y-1">
          {lesson.versions.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-2">
              <span>Version {v.version}</span>
              <Badge tone={v.status === "PUBLISHED" ? "success" : v.status === "IN_REVIEW" ? "primary" : "neutral"}>
                {v.status === "IN_REVIEW" ? "In review" : v.status.charAt(0) + v.status.slice(1).toLowerCase()}
              </Badge>
              <span className="text-sm text-muted">
                {v.author?.displayName ? `by ${v.author.displayName}, ` : ""}
                {v.createdAt.toLocaleDateString("en-GB")}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {!draft ? (
        <Card className="space-y-2">
          <p>Learners see the published version. To change it, start a new draft – nothing changes for learners until you publish.</p>
          <form action={startDraftAction}>
            <input type="hidden" name="lessonId" value={lesson.id} />
            <SubmitButton>Edit lesson (start a draft)</SubmitButton>
          </form>
        </Card>
      ) : (
        <>
          <Card className="space-y-3">
            <h2 className="text-xl font-bold">
              Version {draft.version} – {draft.status === "IN_REVIEW" ? "waiting for review" : "draft"}
            </h2>
            {draft.reviewNote ? <Alert>Review note: {draft.reviewNote}</Alert> : null}
            <div className="flex flex-wrap gap-3">
              <Link href={`/admin/lessons/${lesson.id}/preview`} className="font-semibold">
                Preview this version
              </Link>
            </div>
            {draft.status === "DRAFT" ? (
              <form action={submitForReviewAction} className="space-y-2">
                <input type="hidden" name="versionId" value={draft.id} />
                <input type="hidden" name="lessonId" value={lesson.id} />
                <label htmlFor="note" className="block font-semibold">
                  Note for the reviewer (optional)
                </label>
                <Textarea id="note" name="note" className="min-h-16" maxLength={1000} />
                <SubmitButton variant="secondary">Send for review</SubmitButton>
              </form>
            ) : (
              <form action={publishVersionAction}>
                <input type="hidden" name="versionId" value={draft.id} />
                <input type="hidden" name="lessonId" value={lesson.id} />
                <SubmitButton>Approve and publish</SubmitButton>
              </form>
            )}
            {lesson.publishedVersionId ? (
              <form action={discardDraftAction}>
                <input type="hidden" name="versionId" value={draft.id} />
                <input type="hidden" name="lessonId" value={lesson.id} />
                <button type="submit" className="text-sm text-danger underline">
                  Discard this draft
                </button>
              </form>
            ) : null}
          </Card>
          <Card>
            <h2 className="text-xl font-bold">Edit</h2>
            <DraftForm
              versionId={draft.id}
              title={draft.title}
              estimatedMinutes={draft.estimatedMinutes}
              objectives={draft.objectives}
              knowledgeCheck={draft.knowledgeCheck ?? ""}
              sections={lessonSections(draft)}
              partLabels={partLabels}
            />
          </Card>
        </>
      )}
    </div>
  );
}
