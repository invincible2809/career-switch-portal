import type { Metadata } from "next";
import Link from "next/link";
import { requireLearner } from "@/server/guards";
import { resetLabAction } from "./actions";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { SubmitButton } from "@/components/forms/form-status";
import { LabNav } from "@/components/lab/lab-nav";
import { LabSpec } from "@/components/lab/lab-spec";
import { LAB_DEMO_ACCOUNT } from "@/lib/lab/catalogue";

export const metadata: Metadata = { title: "ShopEasy Test Lab" };

export default async function LabHome() {
  await requireLearner();
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="ShopEasy Test Lab" intro="A safe practice area with a demo shop, test case tracking, defect reports, and SQL and API sandboxes." />
      <LabNav current="/lab" />
      <Alert>
        <strong>Everything here is made up.</strong> The demo shop uses synthetic products and its own demo account – nothing you do
        here affects the portal or anyone else. It has some <strong>deliberate defects</strong> for you to find.
      </Alert>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-2">
          <h2 className="text-xl font-bold">How to use the Lab</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Read the specification below.</li>
            <li>
              Write test cases in <Link href="/lab/test-cases">Test cases</Link>.
            </li>
            <li>
              Run them in the <Link href="/lab/shop">demo shop</Link> and record what happened.
            </li>
            <li>
              Report what you find in <Link href="/lab/defects">Defect reports</Link>.
            </li>
          </ol>
          <p>
            Demo shop login: <strong>{LAB_DEMO_ACCOUNT.email}</strong> / <strong>{LAB_DEMO_ACCOUNT.password}</strong>
          </p>
        </Card>
        <Card className="space-y-2">
          <h2 className="text-xl font-bold">Start again</h2>
          <p>Reset the demo shop: empties your basket, logs you out of the shop, clears failed login attempts and clears the demo orders. Your test cases and defect reports are kept.</p>
          <form action={resetLabAction}>
            <SubmitButton variant="secondary">Reset the demo shop</SubmitButton>
          </form>
        </Card>
      </div>
      <Card>
        <LabSpec />
      </Card>
    </div>
  );
}
