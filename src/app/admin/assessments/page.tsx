import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { Badge, Card, PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Assessments – Admin" };

export default async function AdminAssessmentsPage() {
  await requireAdmin("assessment:configure");
  const assessments = await db.assessment.findMany({ orderBy: { title: "asc" }, include: { bank: { select: { title: true } } } });
  return (
    <div>
      <PageHeader title="Assessments" intro="Pass marks, number of questions and the optional break between attempts." />
      <ul className="space-y-3">
        {assessments.map((a) => (
          <li key={a.id}>
            <Card className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/admin/assessments/${a.id}`} className="font-semibold">
                {a.title}
              </Link>
              <span className="flex flex-wrap gap-2">
                <Badge>Pass mark {a.passMark}%</Badge>
                <Badge>{a.drawCount} questions</Badge>
                {a.status !== "PUBLISHED" ? <Badge tone="warning">{a.status.toLowerCase()}</Badge> : null}
              </span>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
