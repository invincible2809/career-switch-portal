import type { Metadata } from "next";
import { ResetForm } from "./reset-form";
import { Card, PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Choose a new password" intro="Choosing a new password logs you out on every device." />
      <Card>
        <ResetForm token={token} />
      </Card>
    </div>
  );
}
