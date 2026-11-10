import type { Metadata } from "next";
import { requireLearner } from "@/server/guards";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { LabNav } from "@/components/lab/lab-nav";
import { SqlSandbox } from "@/components/lab/sql-sandbox";

export const metadata: Metadata = { title: "SQL sandbox – Test Lab" };

export default async function SqlPage() {
  await requireLearner();
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="SQL sandbox" intro="Practise checking data with SQL on a made-up ShopEasy database." />
      <LabNav current="/lab/sql" />
      <Alert>
        Your queries run only in your browser on synthetic data – nothing is sent to the server, and you can&apos;t break
        anything. Use <strong>Reset the database</strong> to start again.
      </Alert>
      <Card className="space-y-2">
        <h2 className="text-lg font-bold">The tables</h2>
        <ul className="list-disc pl-5 text-sm">
          <li>
            <code>customers</code> (id, name, city, joined)
          </li>
          <li>
            <code>products</code> (id, name, category, price)
          </li>
          <li>
            <code>orders</code> (id, customer_id, order_date, status, postcode)
          </li>
          <li>
            <code>order_items</code> (order_id, product_id, quantity)
          </li>
        </ul>
      </Card>
      <Card>
        <SqlSandbox />
      </Card>
    </div>
  );
}
