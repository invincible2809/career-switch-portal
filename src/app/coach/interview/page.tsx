import type { Metadata } from "next";
import Link from "next/link";
import { requireLearner } from "@/server/guards";
import { db } from "@/server/db";
import { coachContent } from "@/server/coach/content";
import { Card, PageHeader } from "@/components/ui/card";
import { InterviewForm } from "@/components/coach/interview-form";

export const metadata: Metadata = { title: "Mock interview – Learning coach" };

export default async function InterviewPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireLearner();
  const { q } = await searchParams;
  const { interview } = coachContent();
  const active = user.profile?.activePathwayId ? await db.pathway.findUnique({ where: { id: user.profile.activePathwayId }, select: { slug: true } }) : null;
  const mine = active?.slug === "scrum-master" ? "SCRUM_MASTER" : "QA_TESTER";
  const ordered = [...interview].sort((a, b) => Number(b.pathway === mine) - Number(a.pathway === mine));
  const current = ordered.find((x) => x.id === q) ?? ordered[0];
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Mock interview" intro="Write the answer you'd give, then see which key points you covered. Questions for your pathway come first.">
        <p>
          <Link href="/coach">Back to the coach</Link>
        </p>
      </PageHeader>
      <Card className="space-y-2">
        <h2 className="text-lg font-bold">{current.question}</h2>
        <p className="text-muted">
          <strong className="text-text">What interviewers look for:</strong> {current.lookFor}
        </p>
        <InterviewForm key={current.id} questionId={current.id} question={current.question} outline={current.outline} />
      </Card>
      <nav aria-label="Interview questions">
        <h2 className="text-lg font-bold">All questions</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {ordered.map((x) => (
            <li key={x.id}>
              <Link href={`/coach/interview?q=${x.id}`} aria-current={x.id === current.id ? "page" : undefined}>
                {x.question}
              </Link>{" "}
              <span className="text-sm text-muted">({x.pathway === "SCRUM_MASTER" ? "Scrum Master" : x.pathway === "QA_TESTER" ? "QA Tester" : "Any role"})</span>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
