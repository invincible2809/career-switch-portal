import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import type { OptionSnapshot } from "@/lib/assessment/types";
import { Alert, Badge, Card, PageHeader } from "@/components/ui/card";
import { SubmitButton } from "@/components/forms/form-status";
import { Flash, type FlashParams } from "@/components/admin/flash";
import { discardBankDraftsAction, publishBankAction, setQuestionActiveAction } from "../../actions";
import { QuestionForm, type QuestionFormValues } from "./question-form";

export const metadata: Metadata = { title: "Question bank – Admin" };

export default async function BankPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: FlashParams }) {
  await requireAdmin("content:edit");
  const { id } = await params;
  const flash = await searchParams;
  const bank = await db.questionBank.findUnique({
    where: { id },
    include: { questions: { orderBy: [{ key: "asc" }, { version: "desc" }] } },
  });
  if (!bank) notFound();
  const lessons = (
    await db.lesson.findMany({ include: { publishedVersion: { select: { title: true } }, versions: { take: 1, orderBy: { version: "desc" } } } })
  ).map((l) => ({ slug: l.slug, title: l.publishedVersion?.title ?? l.versions[0]?.title ?? l.slug }));

  // One row per key: its draft (if any) and its current live version.
  const keys = [...new Set(bank.questions.map((q) => q.key))];
  const rows = keys.map((key) => {
    const versions = bank.questions.filter((q) => q.key === key);
    return { key, draft: versions.find((v) => v.draft), live: versions.find((v) => v.active && !v.draft), latest: versions.find((v) => !v.draft) };
  });
  const draftCount = rows.filter((r) => r.draft).length;
  const toValues = (q: (typeof bank.questions)[number]): QuestionFormValues => ({
    key: q.key,
    type: q.type,
    scenario: q.scenario ?? "",
    stem: q.stem,
    options: (q.options as unknown as OptionSnapshot[]).map((o) => ({ text: o.text, correct: !!o.correct, explanation: o.explanation })),
    correctOrder: q.correctOrder.join(", "),
    objective: q.objective,
    lessonSlug: q.lessonSlug,
    sectionKey: q.sectionKey,
    tags: q.tags.join(", "),
    isKey: q.isKey,
  });

  return (
    <div className="space-y-6">
      <PageHeader title={bank.title} intro={`${rows.filter((r) => r.live).length} active questions · ${bank.purpose.toLowerCase().replace("_", " ")} bank`} />
      <Flash {...flash} />
      {draftCount > 0 ? (
        <Alert tone="warning" className="space-y-3">
          <p>
            <strong>{draftCount} draft change{draftCount === 1 ? "" : "s"}</strong> not yet live. Learners still see the
            published questions.
          </p>
          <div className="flex flex-wrap gap-3">
            <form action={publishBankAction}>
              <input type="hidden" name="bankId" value={bank.id} />
              <SubmitButton>Publish bank changes</SubmitButton>
            </form>
            <form action={discardBankDraftsAction}>
              <input type="hidden" name="bankId" value={bank.id} />
              <SubmitButton variant="secondary">Discard drafts</SubmitButton>
            </form>
          </div>
        </Alert>
      ) : null}

      <ul className="space-y-3">
        {rows.map((r) => {
          const shown = r.draft ?? r.live ?? r.latest!;
          return (
            <li key={r.key}>
              <Card className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <code>{r.key}</code>
                  <Badge>v{shown.version}</Badge>
                  {r.draft ? <Badge tone="primary">Draft</Badge> : null}
                  {!r.live && !r.draft ? <Badge tone="warning">Retired</Badge> : null}
                  {shown.generator ? <Badge>Generated: {shown.generator}</Badge> : <Badge>{shown.type.toLowerCase()}</Badge>}
                </div>
                <p className="font-semibold">{shown.generator ? `A fresh variant is generated each time (${JSON.stringify(shown.generatorParams)})` : shown.stem}</p>
                <div className="flex flex-wrap gap-4">
                  {!shown.generator ? (
                    <details>
                      <summary className="cursor-pointer font-semibold text-primary">Edit question</summary>
                      <div className="mt-3">
                        <QuestionForm bankId={bank.id} values={toValues(shown)} lessons={lessons} idPrefix={`q-${r.key}`} />
                      </div>
                    </details>
                  ) : null}
                  {r.live || r.latest ? (
                    <form action={setQuestionActiveAction}>
                      <input type="hidden" name="questionId" value={(r.live ?? r.latest)!.id} />
                      <input type="hidden" name="bankId" value={bank.id} />
                      <input type="hidden" name="active" value={r.live ? "false" : "true"} />
                      <button type="submit" className="font-semibold text-primary underline">
                        {r.live ? "Retire" : "Restore"}
                      </button>
                    </form>
                  ) : null}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Card>
        <h2 className="text-xl font-bold">Add a question</h2>
        <QuestionForm
          bankId={bank.id}
          lessons={lessons}
          idPrefix="new"
          values={{ key: "", type: "SINGLE", scenario: "", stem: "", options: [], correctOrder: "", objective: "", lessonSlug: lessons[0]?.slug ?? "", sectionKey: "explanation", tags: "", isKey: false }}
        />
      </Card>
    </div>
  );
}
