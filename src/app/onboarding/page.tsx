import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/guards";
import { PageHeader } from "@/components/ui/card";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Getting started" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin");
  if (user.profile?.onboardingCompletedAt) redirect("/dashboard");
  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`Welcome, ${user.displayName}`}
        intro="A few questions to set up your learning plan. It takes about 5 minutes, and you can change any of this later."
      />
      <OnboardingForm />
    </div>
  );
}
