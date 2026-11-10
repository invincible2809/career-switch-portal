import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { lessonSections } from "@/server/learning";
import { renderMarkdown } from "@/lib/lesson/markdown";
import { Alert, PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Preview – Admin" };

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("content:edit");
  const { id } = await params;
  const v = await db.lessonVersion.findFirst({
    where: { lessonId: id, status: { in: ["DRAFT", "IN_REVIEW"] } },
    orderBy: { version: "desc" },
  });
  if (!v) notFound();
  return (
    <div className="space-y-6">
      <Alert tone="warning">Preview of version {v.version}. Learners can&apos;t see this until it&apos;s published.</Alert>
      <PageHeader title={v.title}>
        <Link href={`/admin/lessons/${id}`}>Back to editing</Link>
      </PageHeader>
      {lessonSections(v).map((s, i) => (
        <section key={s.key} className="space-y-2 border-t border-border pt-4">
          <h2 className="text-xl font-bold">
            {i + 1}. {s.title}
          </h2>
          <div className="prose-lesson" dangerouslySetInnerHTML={{ __html: renderMarkdown(s.markdown || "_(empty)_") }} />
        </section>
      ))}
    </div>
  );
}
