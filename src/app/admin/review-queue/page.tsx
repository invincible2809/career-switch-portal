import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import type { CoachReply } from "@/server/coach/service";
import { Badge, Card, PageHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/forms/form-status";
import { Flash, type FlashParams } from "@/components/admin/flash";
import { resolveFlagAction } from "../actions";

export const metadata: Metadata = { title: "Review queue – Admin" };

export default async function ReviewQueuePage({ searchParams }: { searchParams: FlashParams }) {
  await requireAdmin("content:edit");
  const flash = await searchParams;
  const flags = await db.flaggedItem.findMany({ orderBy: [{ status: "asc" }, { createdAt: "asc" }], take: 100, include: { resolvedBy: { select: { displayName: true } } } });

  const details = await Promise.all(
    flags.map(async (f) => {
      if (f.kind === "COACH_ANSWER") {
        const reply = await db.coachMessage.findUnique({ where: { id: f.targetId } });
        const question = reply
          ? await db.coachMessage.findFirst({ where: { userId: reply.userId, threadId: reply.threadId, role: "learner", createdAt: { lte: reply.createdAt } }, orderBy: { createdAt: "desc" } })
          : null;
        return { label: "Coach answer", question: question?.content ?? "(deleted)", reply: reply ? (JSON.parse(reply.content) as CoachReply) : null, link: null };
      }
      if (f.kind === "LESSON") {
        const l = await db.lesson.findUnique({ where: { id: f.targetId }, include: { publishedVersion: { select: { title: true } } } });
        return { label: "Lesson", question: l?.publishedVersion?.title ?? "(deleted lesson)", reply: null, link: l ? `/admin/lessons/${l.id}` : null };
      }
      const q = await db.question.findUnique({ where: { id: f.targetId } });
      return { label: "Question", question: q?.stem ?? "(deleted question)", reply: null, link: q ? `/admin/question-banks/${q.bankId}` : null };
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Review queue" intro="Coach answers, lessons and questions that learners have flagged. Open items first." />
      <Flash {...flash} />
      {flags.length === 0 ? <p>Nothing has been flagged.</p> : null}
      <ul className="space-y-3" data-testid="review-queue">
        {flags.map((f, i) => {
          const d = details[i];
          return (
            <li key={f.id}>
              <Card className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={f.status === "OPEN" ? "primary" : "neutral"}>{f.status === "OPEN" ? "Open" : "Resolved"}</Badge>
                  <Badge>{d.label}</Badge>
                  <span className="text-sm text-muted">{f.createdAt.toLocaleString("en-GB")}</span>
                </div>
                <p>
                  <strong>{d.label === "Coach answer" ? "Learner's question" : "Item"}:</strong> {d.question}{" "}
                  {d.link ? <Link href={d.link}>Open</Link> : null}
                </p>
                {d.reply ? (
                  <div className="rounded-md bg-surface-muted p-3 text-sm">
                    <p>{d.reply.intro}</p>
                    <ul className="list-disc pl-5">
                      {d.reply.excerpts.map((e, j) => (
                        <li key={j}>
                          {e.lessonTitle} – {e.sectionTitle}
                          {e.excerpt ? `: “${e.excerpt}”` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <p>
                  <strong>Reason given:</strong> {f.reason}
                </p>
                {f.status === "OPEN" ? (
                  <form action={resolveFlagAction} className="space-y-2">
                    <input type="hidden" name="flagId" value={f.id} />
                    <label htmlFor={`res-${f.id}`} className="block text-sm font-semibold">
                      What did you do?
                    </label>
                    <Textarea id={`res-${f.id}`} name="resolution" className="min-h-16" maxLength={1000} />
                    <SubmitButton variant="secondary" size="sm">
                      Mark as resolved
                    </SubmitButton>
                  </form>
                ) : (
                  <p className="text-sm text-muted">
                    Resolved by {f.resolvedBy?.displayName ?? "an admin"}: {f.resolution}
                  </p>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
