import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { evaluateRubric, type MinimumRule } from "@/lib/assignments/evaluate";
import { rubricFor } from "@/server/assignments/service";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/forms/form-status";
import { Flash, type FlashParams } from "@/components/admin/flash";
import { SubmissionAnswers } from "@/components/assignments/submission-answers";
import { assessSubmissionAction, overrideCompetencyAction } from "../../actions";

export const metadata: Metadata = { title: "Assess submission – Admin" };

export default async function AssessSubmissionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: FlashParams }) {
  await requireAdmin("submissions:assess");
  const { id } = await params;
  const flash = await searchParams;
  const s = await db.submission.findUnique({
    where: { id },
    include: {
      user: { select: { displayName: true } },
      competency: { include: { overriddenBy: { select: { displayName: true } } } },
      scores: { orderBy: { createdAt: "asc" } },
      assignment: true,
    },
  });
  if (!s) notFound();
  const rubric = await rubricFor(s);
  const rule = rubric.minimumRule as unknown as MinimumRule;
  const e = evaluateRubric(
    rubric.criteria.map((c) => c.id),
    s.scores.map((x) => ({ criterionId: x.criterionId, score: x.score, source: x.source, createdAt: x.createdAt })),
    rule,
  );
  const latest = (cid: string, source: string) => s.scores.filter((x) => x.criterionId === cid && x.source === source).at(-1);

  return (
    <div className="space-y-6">
      <PageHeader title={`${s.assignment.title} – ${s.user.displayName}`} intro={`Submitted ${s.submittedAt.toLocaleString("en-GB")}`} />
      <Flash {...flash} />
      <Alert tone={s.competency ? "success" : e.complete ? "warning" : "info"}>
        {s.competency
          ? `Competency demonstrated${s.competency.overriddenBy ? ` (override by ${s.competency.overriddenBy.displayName})` : ""}.`
          : e.complete
            ? `Assessed – not demonstrated (minimum ${rule.minEach} on every criterion).`
            : `Awaiting review: ${e.awaiting.length} criterion${e.awaiting.length === 1 ? "" : "s"} still need a score.`}
      </Alert>

      <Card>
        <h2 className="text-xl font-bold">Score against the rubric</h2>
        <p className="text-sm text-muted">
          Your score replaces the automated one for that criterion. Leave a criterion on &quot;Keep current&quot; to keep its
          existing score. The learner&apos;s self-assessment is shown for reference only.
        </p>
        <form action={assessSubmissionAction} className="mt-4 space-y-4">
          <input type="hidden" name="submissionId" value={s.id} />
          {rubric.criteria.map((c) => {
            const auto = latest(c.id, "AUTOMATED");
            const assessor = latest(c.id, "ASSESSOR");
            const self = latest(c.id, "SELF");
            const guidance = latest(c.id, "GUIDANCE");
            const d = c.descriptors as Record<string, string>;
            return (
              <fieldset key={c.id} className="space-y-2 rounded-md border border-border p-4">
                <legend className="px-1 font-bold">{c.title}</legend>
                <ul className="text-sm">
                  {[0, 1, 2, 3].map((n) => (
                    <li key={n}>
                      <strong>{n}:</strong> {d[String(n)]}
                    </li>
                  ))}
                </ul>
                <p className="text-sm">
                  Automated: {auto ? `${auto.score}` : "–"} · Assessor: {assessor ? assessor.score : "–"} · Self: {self ? self.score : "–"}
                </p>
                {guidance?.comment ? (
                  <p className="text-sm">
                    <strong>Automated guidance (not a score):</strong> {guidance.comment.split("\n").join(" ")}
                  </p>
                ) : null}
                {auto?.comment ? <pre className="whitespace-pre-wrap rounded bg-surface-muted p-2 text-sm font-sans">{auto.comment}</pre> : null}
                <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
                  <div>
                    <label htmlFor={`score_${c.id}`} className="block text-sm font-semibold">
                      Your score for {c.title}
                    </label>
                    <Select id={`score_${c.id}`} name={`score_${c.id}`} defaultValue="">
                      <option value="">Keep current</option>
                      {[0, 1, 2, 3].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label htmlFor={`comment_${c.id}`} className="block text-sm font-semibold">
                      Comment for the learner
                    </label>
                    <Textarea id={`comment_${c.id}`} name={`comment_${c.id}`} defaultValue={assessor?.comment ?? ""} className="min-h-16" maxLength={2000} />
                  </div>
                </div>
              </fieldset>
            );
          })}
          <SubmitButton>Save scores</SubmitButton>
        </form>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-bold">Override competency</h2>
        <p className="text-sm text-muted">Use only when the rubric result is clearly wrong. The reason is kept in the audit log.</p>
        <form action={overrideCompetencyAction} className="space-y-3">
          <input type="hidden" name="submissionId" value={s.id} />
          <input type="hidden" name="grant" value={s.competency ? "false" : "true"} />
          <label htmlFor="reason" className="block font-semibold">
            Reason
          </label>
          <Textarea id="reason" name="reason" className="min-h-16" maxLength={1000} required />
          <SubmitButton variant="secondary">{s.competency ? "Remove competency" : "Mark competency as demonstrated"}</SubmitButton>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">The learner&apos;s work</h2>
        <SubmissionAnswers formKind={s.assignment.formKind} payload={s.payload} />
      </Card>
    </div>
  );
}
