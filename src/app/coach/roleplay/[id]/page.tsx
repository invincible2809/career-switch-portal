import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireLearner } from "@/server/guards";
import { coachContent } from "@/server/coach/content";
import { Alert, Badge, Card, PageHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { CoachLabel } from "@/components/coach/coach-label";

export const metadata: Metadata = { title: "Role-play – Learning coach" };

/** A branching conversation. The path so far is kept in the URL (?path=0,1), so it needs no storage. */
export default async function RolePlayPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ path?: string }> }) {
  await requireLearner();
  const { id } = await params;
  const { path = "" } = await searchParams;
  const rp = coachContent().roleplays.find((r) => r.id === id);
  if (!rp) notFound();
  const picks = path
    .split(",")
    .filter((x) => x !== "")
    .map(Number)
    .slice(0, 20);

  const steps: { speaker: string; line: string; choice?: { text: string; feedback: string; quality: string } }[] = [];
  let nodeId = rp.start;
  for (const pick of picks) {
    const node = rp.nodes[nodeId];
    const choice = node?.choices[pick];
    if (!choice) break;
    steps.push({ speaker: node.speaker, line: node.line, choice });
    nodeId = choice.next;
  }
  const current = rp.nodes[nodeId];
  const nextPath = (i: number) => [...picks.slice(0, steps.length), i].join(",");
  const tone = (q: string) => (q === "good" ? "success" : q === "ok" ? "primary" : "warning") as "success" | "primary" | "warning";

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader title={rp.title} intro={rp.intro}>
        <p>
          <Link href="/coach">Back to the coach</Link>
        </p>
      </PageHeader>
      <Alert>Simulated conversation for practice. ShopEasy and its people are made up.</Alert>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="space-y-2">
            <Card>
              <p>
                <strong>{s.speaker}:</strong> {s.line}
              </p>
            </Card>
            <Card className="ml-4 space-y-1 sm:ml-10" data-testid="roleplay-feedback">
              <p>
                <strong>You:</strong> {s.choice!.text}
              </p>
              <CoachLabel />
              <p>
                <Badge tone={tone(s.choice!.quality)}>{s.choice!.quality === "good" ? "Strong response" : s.choice!.quality === "ok" ? "Reasonable" : "Could go better"}</Badge>{" "}
                {s.choice!.feedback}
              </p>
            </Card>
          </li>
        ))}
      </ol>
      <Card className="space-y-3">
        <p>
          <strong>{current.speaker}:</strong> {current.line}
        </p>
        {current.choices.length ? (
          <nav aria-label="Your reply">
            <p className="font-semibold">What do you say?</p>
            <ul className="mt-2 space-y-2">
              {current.choices.map((c, i) => (
                <li key={i}>
                  <Link href={`/coach/roleplay/${rp.id}?path=${nextPath(i)}`} className="block rounded-md border border-border p-3 no-underline hover:bg-primary-soft">
                    {c.text}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <div className="space-y-2">
            <p className="font-semibold">End of the conversation.</p>
            <Link href={`/coach/roleplay/${rp.id}`} className={buttonVariants({ variant: "secondary" })}>
              Try it again with different choices
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
