import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/guards";
import { LoginForm } from "./login-form";
import { Alert, Card, PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Log in" />
      {sp.reset ? <Alert tone="success" className="mb-4">Your password has been changed. You can now log in.</Alert> : null}
      {sp.loggedOut ? <Alert className="mb-4">You have logged out.</Alert> : null}
      {sp.deleted ? <Alert className="mb-4">Your account and data have been deleted.</Alert> : null}
      <Card>
        <LoginForm next={sp.next} />
      </Card>
      <p className="mt-4">
        <Link href="/forgot-password">Forgotten your password?</Link>
      </p>
      <p className="mt-2">
        New here? <Link href="/register">Create an account</Link>
      </p>
    </div>
  );
}
