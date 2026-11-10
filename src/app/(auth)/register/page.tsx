import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/guards";
import { RegisterForm } from "./register-form";
import { Card, PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Create an account" intro="It's free to use. We only ask for what we need to save your progress." />
      <Card>
        <RegisterForm />
      </Card>
      <p className="mt-4">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}
