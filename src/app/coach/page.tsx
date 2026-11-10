import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { coachContent } from "@/server/coach/content";
import type { CoachReply } from "@/server/coach/service";
import { clearCoachHistoryAction } from "./actions";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { SubmitButton } from "@/components/forms/form-status";
import { AskForm } from "@/components/coach/ask-form";
import { FlagForm } from "@/components/coach/flag-form";
import { CoachLabel } from "@/components/coach/coach-label";

export const metadata: Metadata = { title: "Learning coach" };

export default async function CoachPage() {
  const user = await requireLearner();
  const messages = await db.coachMessage.findMany({ where: { userId: user.id, threadId: "ask" }, orderBy: [{ createdAt: "desc" }, { role: "asc" }], take: 20 });
  const { roleplays } = coachContent();
  // Pair each question with the reply after it (newest first).
  const pairs: { q: string; reply: CoachReply; id: string; at: Date }[] = [];
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === "coach" && messages[i + 1].role === "learner") {
      pairs.push({ q: messages[i + 1].content, reply: JSON.parse(messages[i].content) as CoachReply, id: messages[i].id, at: messages[i].createdAt });
      i++;
    }
  }
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Learning coach" intro="Ask about anything in the course. The coach answers from the lessons and glossary, gives hints rather than answers to assessed questions, and never writes your assignments." />
      <Alert>
        <strong>The coach is rule-based, not an AI.</strong> It finds the most relevant parts of the course and quotes them with links. Your questions stay on this
        portal.
      </Alert>
      <Card>
        <AskForm />
      </Card>

      {pairs.length > 0 ? (
        <section aria-labelledby="answers-h" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="answers-h" className="text-xl font-bold">
              Your questions
            </h2>
            <form action={clearCoachHistoryAction}>
              <SubmitButton variant="ghost" size="sm">
                Clear history
              </SubmitButton>
            </form>
          </div>
          {pairs.map(({ q, reply, id }) => (
            <Card key={id} className="space-y-3" data-testid="coach-reply">
              <p className="font-semibold">You asked: {q}</p>
              <CoachLabel />
              <p>{reply.intro}</p>
              {reply.excerpts.length ? (
                <ul className="space-y-2">
                  {reply.excerpts.map((e, i) => (
                    <li key={i} className="rounded-md border-l-4 border-primary bg-surface-muted p-3">
                      {e.excerpt ? <p>“{e.excerpt}”</p> : null}
                      <p className="text-sm">
                        <Link href={`/learn/${e.lessonSlug}?section=${e.sectionKey}`}>
                          {e.lessonTitle} – {e.sectionTitle}
                        </Link>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
              {reply.glossary.length ? (
                <dl className="space-y-1">
                  {reply.glossary.map((g) => (
                    <div key={g.slug}>
                      <dt className="inline font-bold">
                        <Link href={`/glossary/${g.slug}`}>{g.term}</Link>:
                      </dt>{" "}
                      <dd className="inline">{g.definition}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {reply.skills.length ? (
                <div>
                  <p className="font-semibold">Skills you may already have:</p>
                  <ul className="list-disc pl-5">
                    {reply.skills.map((s) => (
                      <li key={s.skill}>
                        <strong>{s.skill}</strong> – {s.example}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {reply.practice ? (
                <p className="text-sm">
                  Extra practice:{" "}
                  <Link href={`/learn/${reply.practice.lessonSlug}?section=knowledge-check`}>{reply.practice.lessonTitle} – check your understanding</Link>
                </p>
              ) : null}
              <FlagForm messageId={id} />
            </Card>
          ))}
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-2">
          <h2 className="text-xl font-bold">Practise a conversation</h2>
          <ul className="list-disc space-y-1 pl-5">
            {roleplays.map((r) => (
              <li key={r.id}>
                <Link href={`/coach/roleplay/${r.id}`}>{r.title}</Link>{" "}
                <span className="text-sm text-muted">({r.pathway === "SCRUM_MASTER" ? "Scrum Master" : r.pathway === "QA_TESTER" ? "QA Tester" : "Any role"})</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="space-y-2">
          <h2 className="text-xl font-bold">Mock interview</h2>
          <p>Answer common interview questions and get feedback on what you covered.</p>
          <Link href="/coach/interview">Start a mock interview</Link>
        </Card>
      </div>
    </div>
  );
}
