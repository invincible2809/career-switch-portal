import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireUser } from "@/server/guards";
import { choosePathwayAction } from "../actions";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { SubmitButton } from "@/components/forms/form-status";
import { ROLE_COMPARISON, ROLE_LABEL, type Recommendation } from "@/lib/onboarding/recommend";

export const metadata: Metadata = { title: "Your recommendation" };

export default async function ResultPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const attempt = await db.diagnosticAttempt.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  if (!attempt) redirect("/onboarding/diagnostic");
  const r = attempt.result as unknown as Recommendation;
  const { error } = await searchParams;
  const recommendedSlug = r.pathway === "SCRUM_MASTER" ? "scrum-master" : "qa-tester";

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Your recommendation" intro="Here's what we suggest, and why. You make the final choice." />

      <Card>
        <h2 className="text-xl font-bold">Suggested pathway: {ROLE_LABEL[r.pathway]}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {r.pathwayReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">
          Where to start: {r.startingPoint === "FOUNDATIONS" ? "IT Foundations" : "You could skip to Module 1"}
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {r.startingReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </Card>

      {r.compared ? (
        <section aria-labelledby="compare" className="space-y-3">
          <h2 id="compare" className="text-xl font-bold">
            The two roles side by side
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse bg-surface text-left">
              <caption className="sr-only">Comparison of the Scrum Master and QA Tester roles</caption>
              <thead>
                <tr>
                  <th scope="col" className="border border-border p-2">
                    &nbsp;
                  </th>
                  <th scope="col" className="border border-border p-2">Scrum Master</th>
                  <th scope="col" className="border border-border p-2">QA Tester</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Day to day", "dayToDay"],
                    ["Skills used", "skills"],
                    ["Typical routes in", "entryRoutes"],
                  ] as const
                ).map(([label, key]) => (
                  <tr key={key}>
                    <th scope="row" className="border border-border p-2 align-top">
                      {label}
                    </th>
                    <td className="border border-border p-2 align-top">{ROLE_COMPARISON.SCRUM_MASTER[key]}</td>
                    <td className="border border-border p-2 align-top">{ROLE_COMPARISON.QA_TESTER[key]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <Card>
        <h2 className="text-xl font-bold">Skills you already have</h2>
        <p className="text-muted">
          {user.profile?.industry ? "Based on your previous work:" : "Skills most people bring from previous jobs:"}
        </p>
        <ul className="mt-2 space-y-2">
          {r.transferableSkills.map((s) => (
            <li key={s.skill}>
              <strong>{s.skill}</strong> – {s.example}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <form action={choosePathwayAction} className="space-y-4">
          <fieldset aria-describedby={error ? "pathway-error" : undefined}>
            <legend className="text-xl font-bold">Choose your pathway</legend>
            {error ? (
              <p id="pathway-error" className="font-semibold text-danger">
                Choose one of the pathways to continue.
              </p>
            ) : null}
            <div className="mt-3 space-y-2">
              {(["scrum-master", "qa-tester"] as const).map((slug) => (
                <label key={slug} className="flex items-center gap-3">
                  <input type="radio" name="pathway" value={slug} defaultChecked={slug === recommendedSlug} className="h-5 w-5" />
                  {slug === "scrum-master" ? "Scrum Master" : "QA Tester"}
                  {slug === recommendedSlug ? <span className="text-muted">(suggested)</span> : null}
                </label>
              ))}
            </div>
          </fieldset>
          <Alert>You can switch pathway at any time in Settings without losing any progress.</Alert>
          <SubmitButton>Start learning</SubmitButton>
        </form>
      </Card>
      <p>
        <Link href="/onboarding/diagnostic">Answer the questions again</Link>
      </p>
    </div>
  );
}
