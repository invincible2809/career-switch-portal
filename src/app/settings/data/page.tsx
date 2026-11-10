import type { Metadata } from "next";
import { requireUser } from "@/server/guards";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SettingsNav } from "../settings-nav";
import { DeleteAccountForm } from "./delete-form";

export const metadata: Metadata = { title: "Your data" };

export default async function DataSettingsPage() {
  await requireUser();
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Your data" />
      <SettingsNav current="/settings/data" />
      <Card className="space-y-3">
        <h2 className="text-xl font-bold">Download your data</h2>
        <p>Get a copy of everything we hold about you – your profile, progress, answers, notes and submitted work – as a JSON file.</p>
        <a href="/api/me/export" className={buttonVariants({ variant: "secondary" })} download>
          Download my data
        </a>
      </Card>
      <Card className="space-y-3">
        <h2 className="text-xl font-bold">Delete your account</h2>
        <Alert tone="warning">
          This permanently deletes your account, progress, notes and submitted work. It can&apos;t be undone. You may want
          to download your data first.
        </Alert>
        <DeleteAccountForm />
      </Card>
    </div>
  );
}
