import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { Badge, Card, PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Curriculum – Admin" };

export default async function CurriculumPage() {
  await requireAdmin("content:edit");
  const pathways = await db.pathway.findMany({
    orderBy: { order: "asc" },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { select: { id: true, publishedVersionId: true, versions: { where: { status: { in: ["DRAFT", "IN_REVIEW"] } }, select: { status: true } } } } },
      },
    },
  });
  return (
    <div>
      <PageHeader title="Curriculum" intro="Pathways, modules and lessons. Lessons go from draft, to review, to published." />
      <div className="space-y-6">
        {pathways.map((p) => (
          <Card key={p.id}>
            <h2 className="text-xl font-bold">{p.title}</h2>
            <ul className="mt-3 divide-y divide-border">
              {p.modules.map((m) => {
                const drafts = m.lessons.flatMap((l) => l.versions).length;
                return (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <Link href={`/admin/modules/${m.id}`} className="font-semibold">
                      {m.title}
                    </Link>
                    <span className="flex flex-wrap gap-2">
                      {m.availability === "COMING_SOON" ? <Badge tone="warning">Coming soon</Badge> : null}
                      {m.status !== "PUBLISHED" ? <Badge>{m.status.toLowerCase()}</Badge> : null}
                      <Badge>{m.lessons.filter((l) => l.publishedVersionId).length} published lessons</Badge>
                      {drafts ? <Badge tone="primary">{drafts} draft{drafts === 1 ? "" : "s"}</Badge> : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
