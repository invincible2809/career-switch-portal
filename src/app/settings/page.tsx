import type { Metadata } from "next";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { Card, PageHeader } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import { SettingsNav } from "./settings-nav";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireLearner();
  const active = user.profile?.activePathwayId
    ? await db.pathway.findUnique({ where: { id: user.profile.activePathwayId }, select: { slug: true } })
    : null;
  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" />
      <SettingsNav current="/settings" />
      <Card>
        <ProfileForm
          values={{
            displayName: user.displayName,
            pathway: active?.slug ?? "qa-tester",
            weeklyMinutes: user.profile?.weeklyMinutes ?? 120,
            goal: user.profile?.goal ?? "",
            consent: !!user.profile?.optionalDataConsentAt,
            previousRoles: user.profile?.previousRoles.join(", ") ?? "",
            industry: user.profile?.industry ?? "",
          }}
        />
      </Card>
    </div>
  );
}
