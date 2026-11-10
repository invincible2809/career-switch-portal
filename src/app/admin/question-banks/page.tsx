import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { Badge, Card, PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Question banks – Admin" };

export default async function BanksPage() {
  await requireAdmin("content:edit");
  const banks = await db.questionBank.findMany({ orderBy: { slug: "asc" }, include: { questions: { select: { active: true, draft: true } } } });
  return (
    <div>
      <PageHeader title="Question banks" intro="Changes are saved as drafts and go live when you publish the bank." />
      <ul className="space-y-3">
        {banks.map((b) => {
          const active = b.questions.filter((q) => q.active && !q.draft).length;
          const drafts = b.questions.filter((q) => q.draft).length;
          return (
            <li key={b.id}>
              <Card className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/admin/question-banks/${b.id}`} className="font-semibold">
                  {b.title}
                </Link>
                <span className="flex flex-wrap gap-2">
                  <Badge>{b.purpose.replace("_", " ").toLowerCase()}</Badge>
                  <Badge tone={b.purpose === "MODULE" && active < 25 ? "warning" : "neutral"}>{active} active</Badge>
                  {drafts ? <Badge tone="primary">{drafts} draft change{drafts === 1 ? "" : "s"}</Badge> : null}
                </span>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
