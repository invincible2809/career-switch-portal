import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { PageHeader } from "@/components/ui/card";
import { LESSON_PARTS } from "@/lib/content/lesson-parts";

export const metadata: Metadata = { title: "Bookmarks" };

export default async function BookmarksPage() {
  const user = await requireLearner();
  const bookmarks = await db.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { lesson: { select: { slug: true, publishedVersion: { select: { title: true } } } } },
  });
  const label = (k: string) => LESSON_PARTS.find((p) => p.key === k)?.label ?? k;
  return (
    <div className="max-w-3xl">
      <PageHeader title="Bookmarks" />
      {bookmarks.length === 0 ? <p>No bookmarks yet. Use &quot;Bookmark this section&quot; in any lesson.</p> : null}
      <ul className="list-disc space-y-2 pl-5">
        {bookmarks.map((b) => (
          <li key={b.id}>
            <Link href={`/learn/${b.lesson.slug}?section=${b.sectionKey}`}>
              {b.lesson.publishedVersion?.title ?? b.lesson.slug} – {label(b.sectionKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
