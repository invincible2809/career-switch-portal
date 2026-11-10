import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { isMailDemoMode } from "@/server/mail";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Reset your password" intro="Enter the email you registered with and we'll send you a link." />
      {isMailDemoMode() ? (
        <Alert tone="warning" className="mb-4">
          <strong>Demo mode:</strong> email isn&apos;t connected. Reset emails appear in the{" "}
          <a href="/dev/mailbox">demo mailbox</a> instead of being sent.
        </Alert>
      ) : null}
      <Card>
        <ForgotForm />
      </Card>
    </div>
  );
}
