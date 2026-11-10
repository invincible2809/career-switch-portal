import type { Metadata } from "next";
import Link from "next/link";
import { requireLearner } from "@/server/guards";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { LabNav } from "@/components/lab/lab-nav";
import { ApiSandbox } from "@/components/lab/api-sandbox";

export const metadata: Metadata = { title: "API sandbox – Test Lab" };

const EXERCISES = [
  "GET /products and find how many kettles are in stock.",
  "Send DELETE /basket to empty your basket. Then POST /basket/items to put 2 mugs in it, and GET /basket to check the subtotal is £16.00. What is the total, and why?",
  "Try POST /basket/items with a quantity of 11. What status code and message come back? Does that match the specification?",
  "Try the same request with a quantity of 0, then -1. Compare the responses with the specification – would you raise a defect?",
  "Change the URL to an address that isn't on the list and send it. What happens, and why does the sandbox do that?",
];

export default async function ApiPage() {
  await requireLearner();
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="API sandbox" intro="Send requests to ShopEasy's mock API and read the responses. It uses the same demo shop as the Test Lab, so your basket is shared." />
      <LabNav current="/lab/api" />
      <Alert>
        The sandbox can only call the portal&apos;s own mock ShopEasy API. Requests to any other address are blocked, and
        nothing here touches real systems.
      </Alert>
      <Card className="space-y-2">
        <h2 className="text-lg font-bold">Try these</h2>
        <ol className="list-decimal space-y-1 pl-5">
          {EXERCISES.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ol>
        <p className="text-sm text-muted">
          Need a reminder? See <Link href="/glossary/status-code">status code</Link> and <Link href="/glossary/api">API</Link> in the glossary.
        </p>
      </Card>
      <Card>
        <ApiSandbox />
      </Card>
    </div>
  );
}
