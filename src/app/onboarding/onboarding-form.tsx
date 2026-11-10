"use client";

import { useActionState } from "react";
import { saveOnboardingAction } from "./actions";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import { Card } from "@/components/ui/card";
import { INDUSTRIES } from "@/lib/onboarding/skills-map";
import { SKILL_KEYS, WEEKLY_OPTIONS } from "@/lib/schemas/onboarding";
import type { FormState } from "@/lib/schemas/auth";

const labels: Record<string, string> = {
  techConfidence: "Confidence with technology",
  preferredPathway: "Pathway",
  weeklyMinutes: "Study time",
  communication: "Explaining things",
  organisation: "Organising work",
  detail: "Spotting mistakes",
  problemSolving: "Working out what went wrong",
};

function Legend({ children }: { children: React.ReactNode }) {
  return <legend className="mb-2 text-xl font-bold">{children}</legend>;
}

function ErrorText({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return (
    <p id={id} className="text-sm font-semibold text-danger">
      <span className="sr-only">Error: </span>
      {text}
    </p>
  );
}

export function OnboardingForm() {
  const [state, action] = useActionState<FormState, FormData>(saveOnboardingAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-6" noValidate>
      <FormMessages state={state} labels={labels} />

      <Card>
        <fieldset className="space-y-4">
          <Legend>1. About you (optional)</Legend>
          <p className="text-muted">
            Telling us about your previous work lets us show how your skills carry over. You can skip this section.
          </p>
          <div className="flex items-start gap-3">
            <input id="consent" name="consent" type="checkbox" className="mt-1 h-5 w-5" />
            <label htmlFor="consent">
              I&apos;m happy for this portal to store my previous job and industry to personalise my plan. I can remove
              them at any time.
            </label>
          </div>
          <Field id="previousRoles" label="Previous job titles" hint="Separate them with commas, for example: shift supervisor, receptionist">
            {(a) => <Input {...a} name="previousRoles" maxLength={300} />}
          </Field>
          <Field id="industry" label="Industry you have most experience in">
            {(a) => (
              <Select {...a} name="industry" defaultValue="">
                <option value="">Prefer not to say</option>
                {INDUSTRIES.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </fieldset>
      </Card>

      <Card>
        <fieldset className="space-y-4" aria-describedby={fe.techConfidence ? "techConfidence-error" : undefined}>
          <Legend>2. Your skills and confidence</Legend>
          <div role="radiogroup" aria-labelledby="techConfidence-label" id="techConfidence" tabIndex={-1}>
            <p id="techConfidence-label" className="font-semibold">
              How confident do you feel using technology at work?
            </p>
            <p className="text-sm text-muted">1 = not at all confident, 5 = very confident</p>
            <ErrorText id="techConfidence-error" text={fe.techConfidence} />
            <div className="mt-2 flex flex-wrap gap-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="flex items-center gap-2">
                  <input type="radio" name="techConfidence" value={n} className="h-5 w-5" />
                  {n}
                </label>
              ))}
            </div>
          </div>
          <p className="font-semibold">How would you rate yourself at…</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {SKILL_KEYS.map((s) => (
              <Field key={s.key} id={s.key} label={s.label} error={fe[s.key]}>
                {(a) => (
                  <Select {...a} name={s.key} defaultValue="3">
                    <option value="1">1 – not yet</option>
                    <option value="2">2</option>
                    <option value="3">3 – about average</option>
                    <option value="4">4</option>
                    <option value="5">5 – a real strength</option>
                  </Select>
                )}
              </Field>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card>
        <fieldset className="space-y-3" id="preferredPathway" tabIndex={-1} aria-describedby={fe.preferredPathway ? "preferredPathway-error" : undefined}>
          <Legend>3. Which role interests you?</Legend>
          <ErrorText id="preferredPathway-error" text={fe.preferredPathway} />
          {[
            { v: "SCRUM_MASTER", l: "Scrum Master", d: "Help a team work well together and improve how they work." },
            { v: "QA_TESTER", l: "QA Tester", d: "Check software works properly and report problems clearly." },
            { v: "HELP_ME_CHOOSE", l: "Help me choose", d: "We'll compare both roles and suggest one. You make the final choice." },
          ].map((o) => (
            <label key={o.v} className="flex items-start gap-3 rounded-md border border-border p-3">
              <input type="radio" name="preferredPathway" value={o.v} className="mt-1 h-5 w-5" />
              <span>
                <span className="font-semibold">{o.l}</span>
                <span className="block text-muted">{o.d}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </Card>

      <Card>
        <fieldset className="space-y-4">
          <Legend>4. Time and goals</Legend>
          <Field id="weeklyMinutes" label="How much time can you usually study each week?" hint="Your plan adjusts if a week gets busy. There are no streaks or penalties." error={fe.weeklyMinutes}>
            {(a) => (
              <Select {...a} name="weeklyMinutes" defaultValue="120">
                {WEEKLY_OPTIONS.map((o) => (
                  <option key={o.minutes} value={o.minutes}>
                    {o.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field id="goal" label="What's your goal? (optional)" hint='For example: "Change career within 6 months"'>
            {(a) => <Textarea {...a} name="goal" maxLength={300} className="min-h-20" />}
          </Field>
        </fieldset>
      </Card>

      <Card>
        <fieldset className="space-y-4">
          <Legend>5. How you like to learn</Legend>
          <p className="text-muted">These change how the site looks for you. You can change them any time in Settings.</p>
          <Field id="textScale" label="Text size">
            {(a) => (
              <Select {...a} name="textScale" defaultValue="DEFAULT">
                <option value="DEFAULT">Standard</option>
                <option value="LARGE">Large</option>
                <option value="LARGER">Larger</option>
              </Select>
            )}
          </Field>
          {[
            { n: "dyslexiaFont", l: "Use a dyslexia-friendly font (Atkinson Hyperlegible)" },
            { n: "reducedMotion", l: "Reduce movement and animation" },
            { n: "readAloud", l: "Show a 'Read aloud' button on lessons (uses your browser's built-in voice)" },
          ].map((c) => (
            <div key={c.n} className="flex items-start gap-3">
              <input id={c.n} name={c.n} type="checkbox" className="mt-1 h-5 w-5" />
              <label htmlFor={c.n}>{c.l}</label>
            </div>
          ))}
        </fieldset>
      </Card>

      <SubmitButton pendingText="Saving…">Save and continue</SubmitButton>
    </form>
  );
}
