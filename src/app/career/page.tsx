import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { coachContent } from "@/server/coach/content";
import { draftStatement } from "@/lib/career/statement";
import { renderMarkdown } from "@/lib/lesson/markdown";
import type { IndustryId } from "@/lib/onboarding/skills-map";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { SkillsStatementForm } from "@/components/coach/skills-statement-form";

export const metadata: Metadata = { title: "Career tools" };

export default async function CareerPage() {
  const user = await requireLearner();
  const [saved, active] = await Promise.all([
    db.skillsStatement.findUnique({ where: { userId: user.id } }),
    user.profile?.activePathwayId ? db.pathway.findUnique({ where: { id: user.profile.activePathwayId }, select: { slug: true } }) : null,
  ]);
  const pathway = active?.slug === "scrum-master" ? "SCRUM_MASTER" : "QA_TESTER";
  const consented = !!user.profile?.optionalDataConsentAt;
  const draft = draftStatement({
    pathway,
    industry: consented ? ((user.profile?.industry as IndustryId | null) ?? null) : null,
    previousRoles: consented ? (user.profile?.previousRoles ?? []) : [],
  });
  const guidance = fs.readFileSync(path.join(process.cwd(), "content", "coach", "cv-guidance.md"), "utf8");
  const questions = coachContent().interview.filter((q) => q.pathway === pathway || q.pathway === "ANY");

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Career tools" intro="Turn your experience and your course work into an honest, convincing application." />
      <Alert>No course can guarantee a job. These tools help you describe what you can really do – clearly and truthfully.</Alert>

      <Card className="space-y-3">
        <h2 className="text-xl font-bold">Transferable-skills statement</h2>
        <p className="text-muted">
          {saved ? "Your saved statement." : "A first draft based on your onboarding answers."} Replace the parts in [square brackets] with real examples – never
          invent experience.
        </p>
        <SkillsStatementForm initial={saved?.body ?? draft} />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-bold">CV guidance</h2>
        <div className="prose-lesson" dangerouslySetInnerHTML={{ __html: renderMarkdown(guidance) }} />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-bold">Interview questions</h2>
        <p>Common questions for your pathway. Practise answering them in the mock interview to get feedback on what you covered.</p>
        <ul className="list-disc space-y-1 pl-5">
          {questions.map((q) => (
            <li key={q.id}>
              <Link href={`/coach/interview?q=${q.id}`}>{q.question}</Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
