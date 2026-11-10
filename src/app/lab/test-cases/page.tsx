import type { Metadata } from "next";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { Badge, Card, PageHeader } from "@/components/ui/card";
import { Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/forms/form-status";
import { LabNav } from "@/components/lab/lab-nav";
import { TestCaseForm } from "@/components/lab/test-case-form";
import { deleteTestCaseAction, recordRunAction } from "../records/actions";

export const metadata: Metadata = { title: "Test cases – Test Lab" };

const STATUS_LABEL = { NOT_RUN: "Not run", PASS: "Pass", FAIL: "Fail", BLOCKED: "Blocked" } as const;

export default async function TestCasesPage() {
  const user = await requireLearner();
  const cases = await db.labTestCase.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  const run = cases.filter((c) => c.status !== "NOT_RUN").length;
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Test cases" intro={`${cases.length} test case${cases.length === 1 ? "" : "s"}, ${run} run. Write them here, run them in the demo shop, then record what happened.`} />
      <LabNav current="/lab/test-cases" />
      <ul className="space-y-3">
        {cases.map((c, i) => (
          <li key={c.id}>
            <Card className="space-y-2" data-testid="test-case">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold">
                  {i + 1}. {c.title}
                </h2>
                <Badge tone={c.status === "PASS" ? "success" : c.status === "FAIL" ? "warning" : "neutral"}>{STATUS_LABEL[c.status]}</Badge>
                <Badge>{c.technique}</Badge>
              </div>
              <p className="text-sm">
                <strong>Data:</strong> {c.testData}
                {c.preconditions ? (
                  <>
                    {" "}
                    · <strong>Preconditions:</strong> {c.preconditions}
                  </>
                ) : null}
              </p>
              <p className="whitespace-pre-wrap text-sm">
                <strong>Steps:</strong> {c.steps}
              </p>
              <p className="text-sm">
                <strong>Expected:</strong> {c.expected}
              </p>
              <form action={recordRunAction} className="grid gap-2 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
                <input type="hidden" name="id" value={c.id} />
                <div>
                  <label htmlFor={`status-${c.id}`} className="block text-sm font-semibold">
                    Result of test {i + 1}
                  </label>
                  <Select id={`status-${c.id}`} name="status" defaultValue={c.status}>
                    {Object.entries(STATUS_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label htmlFor={`actual-${c.id}`} className="block text-sm font-semibold">
                    Actual result of test {i + 1}
                  </label>
                  <Textarea id={`actual-${c.id}`} name="actual" defaultValue={c.actual ?? ""} className="min-h-11" maxLength={800} />
                </div>
                <SubmitButton variant="secondary" size="sm">
                  Save result
                </SubmitButton>
              </form>
              <form action={deleteTestCaseAction}>
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" className="text-sm text-primary underline">
                  Delete test case {i + 1}
                </button>
              </form>
            </Card>
          </li>
        ))}
      </ul>
      <Card>
        <h2 className="text-xl font-bold">Add a test case</h2>
        <TestCaseForm />
      </Card>
    </div>
  );
}
