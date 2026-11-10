import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { deleteNoteAction } from "@/app/learn/[lesson]/actions";
import { Card, PageHeader } from "@/components/ui/card";
import { LESSON_PARTS } from "@/lib/content/lesson-parts";

export const metadata: Metadata = { title: "Your notes" };

export default async function NotesPage() {
  const user = await requireLearner();
  const notes = await db.note.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { lesson: { select: { slug: true, publishedVersion: { select: { title: true } } } } },
  });
  const label = (k: string | null) => LESSON_PARTS.find((p) => p.key === k)?.label ?? "Lesson";
  return (
    <div className="max-w-3xl">
      <PageHeader title="Your notes" intro="Only you can see these." />
      {notes.length === 0 ? <p>You haven&apos;t written any notes yet. You can add them at the bottom of any lesson.</p> : null}
      <ul className="space-y-3">
        {notes.map((n) => (
          <li key={n.id}>
            <Card>
              <p className="text-sm text-muted">
                <Link href={`/learn/${n.lesson.slug}${n.sectionKey ? `?section=${n.sectionKey}` : ""}`}>
                  {n.lesson.publishedVersion?.title ?? n.lesson.slug} – {label(n.sectionKey)}
                </Link>{" "}
                · {n.createdAt.toLocaleDateString("en-GB")}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
              <form action={deleteNoteAction} className="mt-2">
                <input type="hidden" name="noteId" value={n.id} />
                <button type="submit" className="text-sm text-primary underline">
                  Delete note
                </button>
              </form>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
