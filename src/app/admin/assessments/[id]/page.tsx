import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { AssessmentSettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Assessment – Admin" };

export default async function AdminAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("assessment:configure");
  const { id } = await params;
  const a = await db.assessment.findUnique({ where: { id }, include: { bank: true } });
  if (!a) notFound();
  const pool = await db.question.count({ where: { bankId: a.bankId, active: true, draft: false } });
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={a.title}>
        <p>
          Question bank: <Link href={`/admin/question-banks/${a.bankId}`}>{a.bank.title}</Link> ({pool} active questions)
        </p>
      </PageHeader>
      <Alert>Changes apply to attempts started after you save. Attempts already started keep the pass mark they began with.</Alert>
      <Card>
        <AssessmentSettingsForm id={a.id} values={{ passMark: a.passMark, drawCount: a.drawCount, cooldownMinutes: a.cooldownMinutes, status: a.status }} />
      </Card>
    </div>
  );
}
