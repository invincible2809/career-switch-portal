import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { Badge, Card, PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Pathways" };

export default async function PathwaysPage() {
  const user = await requireLearner();
  const pathways = await db.pathway.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    include: { modules: { where: { status: "PUBLISHED" }, select: { availability: true } } },
  });
  return (
    <div>
      <PageHeader title="Pathways" intro="All content is open to you – revisit anything at any time." />
      <ul className="grid gap-4 md:grid-cols-3">
        {pathways.map((p) => (
          <li key={p.id}>
            <Card className="h-full space-y-2">
              <h2 className="text-xl font-bold">
                <Link href={`/pathways/${p.slug}`}>{p.title}</Link>
              </h2>
              {p.id === user.profile?.activePathwayId ? <Badge tone="primary">Your pathway</Badge> : null}
              {p.kind === "SHARED" ? <Badge>Shared by both pathways</Badge> : null}
              <p>{p.summary}</p>
              <p className="text-sm text-muted">
                {p.modules.filter((m) => m.availability === "AVAILABLE").length} of {p.modules.length} modules available now
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
