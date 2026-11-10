"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { submitAssignmentAction } from "@/app/assignments/[slug]/actions";
import { Input, Select, Textarea } from "@/components/ui/field";
import { FormMessages, SubmitButton } from "@/components/forms/form-status";
import { IMPEDIMENT_STATUSES, PRIORITIES, RETRO_STAGES, SEVERITIES, TEST_FIELDS } from "@/lib/assignments/forms";
import { SESSION_LOG } from "@/lib/assignments/qa-session-log";
import type { FormState } from "@/lib/schemas/auth";

function Cell({ id, label, children }: { id: string; label: string; children: (id: string) => React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      {children(id)}
    </div>
  );
}

function SelfAssessment({ criteria }: { criteria: { key: string; title: string }[] }) {
  return (
    <fieldset className="space-y-3 rounded-md border border-border p-4">
      <legend className="px-1 text-lg font-bold">Your self-assessment</legend>
      <p className="text-sm text-muted">
        Score your own work against the rubric. This helps you reflect – it is shown next to the official scores but never
        counts towards competency.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {criteria.map((c) => (
          <Cell key={c.key} id={`self_${c.key}`} label={c.title}>
            {(id) => (
              <Select id={id} name={`self_${c.key}`} defaultValue="">
                <option value="">Not scored</option>
                {[0, 1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            )}
          </Cell>
        ))}
      </div>
    </fieldset>
  );
}

function Shell({ slug, children, criteria }: { slug: string; children: React.ReactNode; criteria: { key: string; title: string }[] }) {
  const { state, formProps, pending } = useFormAction<FormState>(submitAssignmentAction);
  return (
    <form {...formProps} className="space-y-6" noValidate>
      <FormMessages state={state} />
      <input type="hidden" name="slug" value={slug} />
      {children}
      <SelfAssessment criteria={criteria} />
      <p className="text-sm text-muted">
        Submitting doesn&apos;t mark this as mastered. Some criteria are checked automatically; the rest are scored by an
        assessor.
      </p>
      <SubmitButton pending={pending} pendingText="Submitting…">Submit my work</SubmitButton>
    </form>
  );
}

export function ScrumRetroPlanForm({ slug, criteria }: { slug: string; criteria: { key: string; title: string }[] }) {
  return (
    <Shell slug={slug} criteria={criteria}>
      <fieldset className="space-y-2">
        <legend className="text-lg font-bold">Part A – Diagnosis</legend>
        <Cell id="diagnosis" label="What's going wrong for this team, and what's likely causing it?">
          {(id) => <Textarea id={id} name="diagnosis" className="min-h-40" maxLength={5000} />}
        </Cell>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-lg font-bold">Part B – Impediment log (at least 3)</legend>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2">
            <p className="font-semibold sm:col-span-2">Impediment {i + 1}</p>
            <Cell id={`imp_${i}_impediment`} label="Impediment">
              {(id) => <Input id={id} name={`imp_${i}_impediment`} maxLength={500} />}
            </Cell>
            <Cell id={`imp_${i}_impact`} label="Impact on the team">
              {(id) => <Input id={id} name={`imp_${i}_impact`} maxLength={500} />}
            </Cell>
            <Cell id={`imp_${i}_owner`} label="Owner">
              {(id) => <Input id={id} name={`imp_${i}_owner`} maxLength={100} />}
            </Cell>
            <Cell id={`imp_${i}_nextStep`} label="Next step">
              {(id) => <Input id={id} name={`imp_${i}_nextStep`} maxLength={500} />}
            </Cell>
            <Cell id={`imp_${i}_status`} label="Status">
              {(id) => (
                <Select id={id} name={`imp_${i}_status`} defaultValue="">
                  <option value="">Choose…</option>
                  {IMPEDIMENT_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              )}
            </Cell>
          </div>
        ))}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-lg font-bold">Part C – 60-minute retrospective plan</legend>
        <Cell id="retroGoal" label="Goal of the retrospective">
          {(id) => <Input id={id} name="retroGoal" maxLength={500} />}
        </Cell>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-[1fr_2fr_6rem]">
            <p className="font-semibold sm:col-span-3">Part {i + 1}</p>
            <Cell id={`retro_${i}_stage`} label="Stage">
              {(id) => (
                <Select id={id} name={`retro_${i}_stage`} defaultValue="">
                  <option value="">Choose…</option>
                  {RETRO_STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              )}
            </Cell>
            <Cell id={`retro_${i}_activity`} label="Activity">
              {(id) => <Input id={id} name={`retro_${i}_activity`} maxLength={300} />}
            </Cell>
            <Cell id={`retro_${i}_minutes`} label="Minutes">
              {(id) => <Input id={id} name={`retro_${i}_minutes`} type="number" min={0} max={120} inputMode="numeric" />}
            </Cell>
            <div className="sm:col-span-3">
              <Cell id={`retro_${i}_purpose`} label="Why this activity?">
                {(id) => <Input id={id} name={`retro_${i}_purpose`} maxLength={500} />}
              </Cell>
            </div>
          </div>
        ))}
      </fieldset>
    </Shell>
  );
}

export function QaCheckoutForm({ slug, criteria }: { slug: string; criteria: { key: string; title: string }[] }) {
  return (
    <Shell slug={slug} criteria={criteria}>
      <fieldset className="space-y-3">
        <legend className="text-lg font-bold">Part A – Test cases (at least 6)</legend>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div key={i} className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-3">
            <p className="font-semibold sm:col-span-3">Test case {i + 1}</p>
            <div className="sm:col-span-3">
              <Cell id={`tc_${i}_title`} label="Title">
                {(id) => <Input id={id} name={`tc_${i}_title`} maxLength={200} />}
              </Cell>
            </div>
            <Cell id={`tc_${i}_field`} label="What it tests">
              {(id) => (
                <Select id={id} name={`tc_${i}_field`} defaultValue="">
                  <option value="">Choose…</option>
                  {TEST_FIELDS.map((f) => (
                    <option key={f} value={f}>
                      {f === "discount" ? "discount code" : f}
                    </option>
                  ))}
                </Select>
              )}
            </Cell>
            <Cell id={`tc_${i}_technique`} label="Technique">
              {(id) => (
                <Select id={id} name={`tc_${i}_technique`} defaultValue="">
                  <option value="">Choose…</option>
                  <option value="EP">Equivalence partitioning</option>
                  <option value="BVA">Boundary value analysis</option>
                  <option value="OTHER">Other</option>
                </Select>
              )}
            </Cell>
            <Cell id={`tc_${i}_testData`} label="Test data">
              {(id) => <Input id={id} name={`tc_${i}_testData`} maxLength={300} />}
            </Cell>
            <div className="sm:col-span-3 grid gap-3 sm:grid-cols-2">
              <Cell id={`tc_${i}_steps`} label="Steps">
                {(id) => <Textarea id={id} name={`tc_${i}_steps`} className="min-h-16" maxLength={1000} />}
              </Cell>
              <Cell id={`tc_${i}_expected`} label="Expected result">
                {(id) => <Textarea id={id} name={`tc_${i}_expected`} className="min-h-16" maxLength={500} />}
              </Cell>
            </div>
          </div>
        ))}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-lg font-bold">Part B – Defect reports (at least 3)</legend>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2">
            <p className="font-semibold sm:col-span-2">Defect report {i + 1}</p>
            <Cell id={`def_${i}_logEntry`} label="Which log entry shows it?">
              {(id) => (
                <Select id={id} name={`def_${i}_logEntry`} defaultValue="">
                  <option value="">Choose…</option>
                  {SESSION_LOG.map((e) => (
                    <option key={e.n} value={e.n}>
                      Entry {e.n}
                    </option>
                  ))}
                </Select>
              )}
            </Cell>
            <Cell id={`def_${i}_title`} label="Title">
              {(id) => <Input id={id} name={`def_${i}_title`} maxLength={200} />}
            </Cell>
            <Cell id={`def_${i}_environment`} label="Environment">
              {(id) => <Input id={id} name={`def_${i}_environment`} maxLength={200} placeholder="e.g. Test site, Chrome on Windows" />}
            </Cell>
            <Cell id={`def_${i}_evidence`} label="Evidence (optional)">
              {(id) => <Input id={id} name={`def_${i}_evidence`} maxLength={500} />}
            </Cell>
            <div className="sm:col-span-2">
              <Cell id={`def_${i}_steps`} label="Steps to reproduce">
                {(id) => <Textarea id={id} name={`def_${i}_steps`} className="min-h-16" maxLength={1500} />}
              </Cell>
            </div>
            <Cell id={`def_${i}_expected`} label="Expected result">
              {(id) => <Textarea id={id} name={`def_${i}_expected`} className="min-h-16" maxLength={800} />}
            </Cell>
            <Cell id={`def_${i}_actual`} label="Actual result">
              {(id) => <Textarea id={id} name={`def_${i}_actual`} className="min-h-16" maxLength={800} />}
            </Cell>
            <Cell id={`def_${i}_severity`} label="Severity">
              {(id) => (
                <Select id={id} name={`def_${i}_severity`} defaultValue="">
                  <option value="">Choose…</option>
                  {SEVERITIES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              )}
            </Cell>
            <Cell id={`def_${i}_priority`} label="Priority">
              {(id) => (
                <Select id={id} name={`def_${i}_priority`} defaultValue="">
                  <option value="">Choose…</option>
                  {PRIORITIES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              )}
            </Cell>
          </div>
        ))}
      </fieldset>
    </Shell>
  );
}

export interface LabCaseOption {
  id: string;
  title: string;
  technique: string;
  testData: string;
  status: string;
  actual: string | null;
}
export interface LabDefectOption {
  id: string;
  title: string;
  area: string;
  severity: string;
  priority: string;
}

const STATUS_TEXT: Record<string, string> = { NOT_RUN: "Not run yet", PASS: "Pass", FAIL: "Fail", BLOCKED: "Blocked" };

export function QaTestLabForm({
  slug,
  criteria,
  cases,
  defects,
}: {
  slug: string;
  criteria: { key: string; title: string }[];
  cases: LabCaseOption[];
  defects: LabDefectOption[];
}) {
  return (
    <Shell slug={slug} criteria={criteria}>
      <fieldset className="space-y-3">
        <legend className="text-lg font-bold">Part A – Your Test Lab test cases (at least 6, all run)</legend>
        {cases.length === 0 ? <p>You haven&apos;t written any test cases yet. Add them in the Test Lab first.</p> : null}
        {cases.map((c, i) => (
          <div key={c.id} className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-[auto_1fr_12rem] sm:items-center">
            <input id={`include_tc_${c.id}`} name={`include_tc_${c.id}`} type="checkbox" defaultChecked className="h-5 w-5" />
            <label htmlFor={`include_tc_${c.id}`}>
              <span className="font-semibold">
                {i + 1}. {c.title}
              </span>
              <span className="block text-sm text-muted">
                {c.technique} · data: {c.testData} · result: {STATUS_TEXT[c.status] ?? c.status}
                {c.actual ? ` – ${c.actual}` : ""}
              </span>
            </label>
            <Cell id={`field_${c.id}`} label={`What test ${i + 1} tests`}>
              {(id) => (
                <Select id={id} name={`field_${c.id}`} defaultValue="">
                  <option value="">Choose…</option>
                  {TEST_FIELDS.map((f) => (
                    <option key={f} value={f}>
                      {f === "discount" ? "discount code" : f}
                    </option>
                  ))}
                </Select>
              )}
            </Cell>
          </div>
        ))}
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="text-lg font-bold">Part B – Your Test Lab defect reports (at least 3)</legend>
        {defects.length === 0 ? <p>You haven&apos;t written any defect reports yet. Add them in the Test Lab first.</p> : null}
        {defects.map((d, i) => (
          <div key={d.id} className="flex items-start gap-3 rounded-md border border-border p-3">
            <input id={`include_def_${d.id}`} name={`include_def_${d.id}`} type="checkbox" defaultChecked className="mt-1 h-5 w-5" />
            <label htmlFor={`include_def_${d.id}`}>
              <span className="font-semibold">
                {i + 1}. {d.title}
              </span>
              <span className="block text-sm text-muted">
                {d.area} · severity {d.severity} · priority {d.priority}
              </span>
            </label>
          </div>
        ))}
      </fieldset>
    </Shell>
  );
}
