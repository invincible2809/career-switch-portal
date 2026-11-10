import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { LAB_DEFECTS } from "@/server/lab/defects";
import { matchLabReports } from "@/lib/lab/match";
import { Alert, Badge, Card, PageHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { LabNav } from "@/components/lab/lab-nav";
import { DefectForm } from "@/components/lab/defect-form";
import { deleteDefectAction } from "../records/actions";

export const metadata: Metadata = { title: "Defect reports – Test Lab" };

export default async function DefectsPage({ searchParams }: { searchParams: Promise<{ check?: string }> }) {
  const user = await requireLearner();
  const { check } = await searchParams;
  const reports = await db.defectReport.findMany({ where: { userId: user.id, submissionId: null }, orderBy: { createdAt: "asc" } });
  const feedback = check ? matchLabReports(reports, LAB_DEFECTS) : null;
  const coverage = matchLabReports(reports, LAB_DEFECTS);
  // The full list of planted defects is only shown once the learner has submitted the QA assignment.
  const submitted = await db.submission.count({ where: { userId: user.id, assignment: { formKind: "QA_TEST_LAB" } } });

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Defect reports" intro="Report what you find in the demo shop. Use the specification for expected results." />
      <LabNav current="/lab/defects" />
      {reports.length > 0 ? (
        <p>
          <Link href="/lab/defects?check=1" className={buttonVariants({ variant: "secondary" })}>
            Check my reports
          </Link>
        </p>
      ) : null}
      {feedback ? (
        <Alert role="status">
          <strong>Automated guidance from course content – not reviewed by a person.</strong> {feedback.found} clearly described,{" "}
          {feedback.partly} partly described.{" "}
          {submitted ? "" : "The full list of planted defects is shown after you submit the QA practical assignment."}
        </Alert>
      ) : null}
      <ul className="space-y-3">
        {reports.map((r, i) => {
          const m = feedback?.matches[i];
          return (
            <li key={r.id}>
              <Card className="space-y-1" data-testid="defect-report">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold">
                    {i + 1}. {r.title}
                  </h2>
                  <Badge>{r.area.charAt(0).toUpperCase() + r.area.slice(1)}</Badge>
                  <Badge>Severity: {r.severity}</Badge>
                  <Badge>Priority: {r.priority}</Badge>
                  {m ? <Badge tone={m.result === "found" ? "success" : m.result === "partly described" ? "primary" : "warning"}>{m.result}</Badge> : null}
                </div>
                {m ? <p className="text-sm font-semibold">Feedback: {m.note}</p> : null}
                <p className="whitespace-pre-wrap text-sm">
                  <strong>Steps:</strong> {r.steps}
                </p>
                <p className="text-sm">
                  <strong>Expected:</strong> {r.expected} · <strong>Actual:</strong> {r.actual}
                </p>
                <form action={deleteDefectAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className="text-sm text-primary underline">
                    Delete report {i + 1}
                  </button>
                </form>
              </Card>
            </li>
          );
        })}
      </ul>
      {submitted ? (
        <Card>
          <h2 className="text-xl font-bold">All the planted defects</h2>
          <ul className="list-disc pl-5">
            {LAB_DEFECTS.map((d) => (
              <li key={d.key}>
                {d.area.charAt(0).toUpperCase() + d.area.slice(1)}: {d.title}{" "}
                <strong>{coverage.missed.some((m) => m.key === d.key) ? "– not in your current reports" : "– in your reports"}</strong>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <Card>
        <h2 className="text-xl font-bold">New defect report</h2>
        <DefectForm />
      </Card>
    </div>
  );
}
