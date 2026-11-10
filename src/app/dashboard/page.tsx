import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireLearner } from "@/server/guards";
import { getDashboard } from "@/server/dashboard";
import { Alert, Badge, Card, PageHeader, ProgressBar } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireLearner();
  if (user.role === "ADMIN" && !user.profile?.onboardingCompletedAt) redirect("/admin");
  const { welcome } = await searchParams;
  const d = await getDashboard(user.id, user.profile?.activePathwayId ?? null, user.profile?.weeklyMinutes ?? 120);
  const available = d.moduleProgress.filter((m) => !m.comingSoon);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hello, ${user.displayName}`}
        intro={d.activePathway ? `Your pathway: ${d.activePathway.title}` : "Choose a pathway in Settings to see your role modules."}
      />
      {welcome ? (
        <Alert tone="success">You&apos;re all set up. Your plan is below – start whenever you&apos;re ready.</Alert>
      ) : null}

      <Card className="space-y-3" aria-labelledby="continue-heading">
        <h2 id="continue-heading" className="text-xl font-bold">
          Next step
        </h2>
        {d.continueItem ? (
          <>
            <p className="text-muted">{d.continueItem.detail}</p>
            <Link href={d.continueItem.href} className={buttonVariants()} data-testid="continue-link">
              {d.continueItem.label}
            </Link>
          </>
        ) : (
          <p>You&apos;ve finished everything available right now. More modules are on the way.</p>
        )}
      </Card>

      <section aria-labelledby="progress-heading" className="space-y-3">
        <h2 id="progress-heading" className="text-xl font-bold">
          Your progress
        </h2>
        <p className="text-sm text-muted">
          We track three things separately: lessons you&apos;ve finished, assessments you&apos;ve passed, and practical
          skills you&apos;ve shown in assignments.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {available.map((m) => (
            <Card key={m.id} className="space-y-3" data-testid={`module-progress-${m.slug}`}>
              <h3 className="font-bold">
                <Link href={`/pathways/${m.pathwaySlug}/${m.slug}`}>{m.title}</Link>
              </h3>
              <div>
                <p className="text-sm">
                  Lessons finished: {m.lessons.completed} of {m.lessons.total}
                </p>
                <ProgressBar value={m.lessons.total ? (m.lessons.completed / m.lessons.total) * 100 : 0} label={`${m.title} lessons finished`} />
              </div>
              {m.assessments.map((a) => (
                <p key={a.slug} className="flex flex-wrap items-center gap-2 text-sm">
                  Assessment:{" "}
                  {a.passed ? (
                    <Badge tone="success">Passed</Badge>
                  ) : a.bestScore !== null ? (
                    <Badge tone="warning">Best so far {a.bestScore}%</Badge>
                  ) : (
                    <Badge>Not taken yet</Badge>
                  )}
                </p>
              ))}
              <p className="text-sm">
                Practical skills shown:{" "}
                {m.competency.total ? `${m.competency.demonstrated} of ${m.competency.total}` : "no assignment in this module"}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-2">
          <h2 className="text-xl font-bold">This week&apos;s plan</h2>
          {d.plan.items.length ? (
            <ol className="list-decimal space-y-1 pl-5">
              {d.plan.items.map((i) => (
                <li key={i.href + i.title}>
                  <Link href={i.href}>{i.title}</Link> <span className="text-muted">· about {i.minutes} min</span>
                </li>
              ))}
            </ol>
          ) : null}
          <p className="text-sm text-muted">{d.plan.message}</p>
          <p className="text-sm">
            <Link href="/settings">Change your weekly study time</Link>
          </p>
        </Card>

        <Card className="space-y-2">
          <h2 className="text-xl font-bold">Quick review</h2>
          {d.reviewDue > 0 ? (
            <>
              <p>
                {d.reviewDue} question{d.reviewDue === 1 ? " is" : "s are"} ready to look at again. It takes a few minutes.
              </p>
              <Link href="/review" className={buttonVariants({ variant: "secondary" })}>
                Start quick review
              </Link>
            </>
          ) : (
            <p>Nothing due right now. Questions you miss come back after about 1, 3, 7 and 21 days.</p>
          )}
          <p className="pt-2 text-sm">
            <Link href="/notes">Your notes ({d.noteCount})</Link> · <Link href="/bookmarks">Bookmarks ({d.bookmarkCount})</Link>
          </p>
        </Card>
      </div>

      <section aria-labelledby="history-heading" className="space-y-3">
        <h2 id="history-heading" className="text-xl font-bold">
          Assessment history
        </h2>
        {d.attempts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-surface text-left" data-testid="assessment-history">
              <caption className="sr-only">Your most recent assessment attempts</caption>
              <thead>
                <tr>
                  <th scope="col" className="border border-border p-2">Date</th>
                  <th scope="col" className="border border-border p-2">Assessment</th>
                  <th scope="col" className="border border-border p-2">Score</th>
                  <th scope="col" className="border border-border p-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {d.attempts.map((a) => (
                  <tr key={a.id}>
                    <td className="border border-border p-2">{a.submittedAt!.toLocaleDateString("en-GB")}</td>
                    <td className="border border-border p-2">
                      <Link href={`/assessments/${a.assessment.slug}/attempt/${a.id}/result`}>{a.assessment.title}</Link>
                    </td>
                    <td className="border border-border p-2">{a.scorePercent}%</td>
                    <td className="border border-border p-2">{a.passed ? "Passed" : "Not passed yet"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted">No assessments taken yet.</p>
        )}
      </section>

      <Card className="space-y-2">
        <h2 className="text-xl font-bold">Portfolio and career</h2>
        <p>
          {d.portfolioCount === 0 ? "Your portfolio is empty." : `Your portfolio has ${d.portfolioCount} item${d.portfolioCount === 1 ? "" : "s"}.`} Every item
          is labelled as a simulated learning project.
        </p>
        <p className="flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/portfolio">Portfolio</Link>
          <Link href="/career">Career tools</Link>
          <Link href="/certificate">Certificate of Completion</Link>
          <Link href="/coach">Learning coach</Link>
        </p>
      </Card>
    </div>
  );
}
