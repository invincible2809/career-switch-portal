import type { Metadata } from "next";
import { requireUser } from "@/server/guards";
import { Card, PageHeader } from "@/components/ui/card";
import { SettingsNav } from "../settings-nav";
import { AccessibilityForm } from "./accessibility-form";

export const metadata: Metadata = { title: "Display and accessibility" };

export default async function AccessibilitySettingsPage() {
  const user = await requireUser();
  const p = user.accessibility;
  return (
    <div className="max-w-2xl">
      <PageHeader title="Display and accessibility" intro="These settings apply on every page, on any device you log in from." />
      <SettingsNav current="/settings/accessibility" />
      <Card>
        <AccessibilityForm
          values={{
            textScale: p?.textScale ?? "DEFAULT",
            dyslexiaFont: !!p?.dyslexiaFont,
            reducedMotion: !!p?.reducedMotion,
            readAloud: !!p?.readAloud,
          }}
        />
      </Card>
    </div>
  );
}
