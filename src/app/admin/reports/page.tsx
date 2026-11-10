import type { Metadata } from "next";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { reports } from "@/server/admin/reports";
import { LESSON_PARTS } from "@/lib/content/lesson-parts";
import { Card, PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Reports – Admin" };

const th = "border border-border p-2";

export default async function ReportsPage() {
  await requireAdmin("reports:read");
  const r = await reports();
  const lessons = await db.lessonVersion.findMany({ where: { publishedOf: { isNot: null } }, select: { title: true, lesson: { select: { slug: true } } } });
  const lessonTitle = (slug: string) => lessons.find((l) => l.lesson.slug === slug)?.title ?? slug;
  const part = (k: string) => LESSON_PARTS.find((p) => p.key === k)?.label ?? k;
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" intro={`Totals across all ${r.learners} learners. No individual learner is shown.`} />

      <Card className="space-y-2">
        <h2 className="text-xl font-bold">Progress by module</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm" data-testid="progress-report">
            <caption className="sr-only">Learners at each stage of each module</caption>
            <thead>
              <tr>
                <th scope="col" className={th}>Module</th>
                <th scope="col" className={th}>Started</th>
                <th scope="col" className={th}>Finished all lessons</th>
                <th scope="col" className={th}>Passed the assessment</th>
                <th scope="col" className={th}>Competency shown</th>
              </tr>
            </thead>
            <tbody>
              {r.progress.map((m) => (
                <tr key={m.module}>
                  <th scope="row" className={th}>
                    {m.module} <span className="font-normal text-muted">({m.pathway})</span>
                  </th>
                  <td className={th}>{m.started}</td>
                  <td className={th}>{m.finishedLessons}</td>
                  <td className={th}>{m.passedAssessment}</td>
                  <td className={th}>{m.competency ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-xl font-bold">Most-failed assessment questions</h2>
        <p className="text-sm text-muted">Questions answered at least 3 times, ordered by the share answered wrongly. Worth checking for unclear wording.</p>
        {r.mostFailed.length === 0 ? <p>Not enough answers yet.</p> : null}
        <ol className="list-decimal space-y-2 pl-5" data-testid="most-failed">
          {r.mostFailed.map((q) => (
            <li key={q.key}>
              <span className="font-semibold">{q.stem}</span> <code className="text-sm">{q.key}</code>
              <span className="block text-sm text-muted">
                {q.bank} · {q.wrong} of {q.answered} answers wrong ({Math.round((q.wrong / q.answered) * 100)}%)
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-xl font-bold">Common gaps</h2>
        <p className="text-sm text-muted">The lesson sections behind the most wrong answers.</p>
        {r.gaps.length === 0 ? <p>No wrong answers yet.</p> : null}
        <ol className="list-decimal space-y-1 pl-5" data-testid="gaps">
          {r.gaps.map((g) => (
            <li key={`${g.lesson}-${g.section}`}>
              {lessonTitle(g.lesson)} – {part(g.section)}: {g.wrong} wrong answers out of {g.answered}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
