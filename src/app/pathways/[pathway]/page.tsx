import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { Badge, Card, PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Pathway" };

export default async function PathwayPage({ params }: { params: Promise<{ pathway: string }> }) {
  const user = await requireLearner();
  const { pathway: slug } = await params;
  const pathway = await db.pathway.findUnique({
    where: { slug },
    include: {
      modules: {
        where: { status: "PUBLISHED" },
        orderBy: { order: "asc" },
        include: { lessons: { where: { publishedVersionId: { not: null } }, select: { progress: { where: { userId: user.id } } } } },
      },
    },
  });
  if (!pathway || pathway.status !== "PUBLISHED") notFound();
  return (
    <div>
      <PageHeader title={pathway.title} intro={pathway.summary}>
        <p>
          <Link href="/pathways">All pathways</Link>
        </p>
      </PageHeader>
      <ol className="space-y-3">
        {pathway.modules.map((m, i) => {
          const done = m.lessons.filter((l) => l.progress[0]?.contentCompletedAt).length;
          return (
            <li key={m.id}>
              <Card className="space-y-1">
                <h2 className="text-lg font-bold">
                  {m.availability === "AVAILABLE" ? (
                    <Link href={`/pathways/${pathway.slug}/${m.slug}`}>
                      Module {i + 1}: {m.title}
                    </Link>
                  ) : (
                    <>
                      Module {i + 1}: {m.title}
                    </>
                  )}
                </h2>
                <p>{m.summary}</p>
                {m.availability === "COMING_SOON" ? (
                  <Badge tone="warning">Coming soon</Badge>
                ) : (
                  <p className="text-sm text-muted">
                    {done} of {m.lessons.length} lessons finished
                  </p>
                )}
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
