import type { QaCheckout, QaTestLab, ScrumRetroPlan } from "@/lib/assignments/forms";
import { RETRO_STAGES } from "@/lib/assignments/forms";

/** Read-only view of a submission, used by learners and assessors. */
export function SubmissionAnswers({ formKind, payload }: { formKind: string; payload: unknown }) {
  if (formKind === "SCRUM_RETRO_PLAN") {
    const p = payload as ScrumRetroPlan;
    const total = p.retroRows.reduce((s, r) => s + (r.minutes || 0), 0);
    return (
      <div className="space-y-4">
        <section>
          <h3 className="font-bold">Diagnosis</h3>
          <p className="whitespace-pre-wrap">{p.diagnosis}</p>
        </section>
        <section>
          <h3 className="font-bold">Impediment log</h3>
          <ol className="list-decimal space-y-2 pl-5">
            {p.impediments.map((r, i) => (
              <li key={i}>
                <strong>{r.impediment || "(no description)"}</strong> – impact: {r.impact || "–"}; owner: {r.owner || "–"}; next step: {r.nextStep || "–"}; status: {r.status || "–"}
              </li>
            ))}
          </ol>
        </section>
        <section>
          <h3 className="font-bold">Retrospective plan ({total} minutes)</h3>
          <p>Goal: {p.retroGoal || "–"}</p>
          <ol className="list-decimal space-y-1 pl-5">
            {p.retroRows.map((r, i) => (
              <li key={i}>
                {RETRO_STAGES.find((s) => s.key === r.stage)?.label ?? "No stage"} · {r.minutes} min · {r.activity}
                {r.purpose ? ` – ${r.purpose}` : ""}
              </li>
            ))}
          </ol>
        </section>
      </div>
    );
  }
  if (formKind === "QA_TEST_LAB") {
    const p = payload as QaTestLab;
    return (
      <div className="space-y-4">
        <section>
          <h3 className="font-bold">Test cases run in the Test Lab</h3>
          <ol className="list-decimal space-y-2 pl-5">
            {p.testCases.map((t, i) => (
              <li key={i}>
                <strong>{t.title}</strong> – {t.field || "?"}, {t.technique}; data: {t.testData}; expected: {t.expected}
                <br />
                Result: <strong>{t.status.replace("_", " ").toLowerCase()}</strong>
                {t.actual ? ` – actual: ${t.actual}` : ""}
              </li>
            ))}
          </ol>
        </section>
        <section>
          <h3 className="font-bold">Defect reports</h3>
          <ol className="list-decimal space-y-2 pl-5">
            {p.defects.map((d, i) => (
              <li key={i}>
                <strong>{d.title}</strong> ({d.area}) – severity {d.severity}, priority {d.priority}
                <br />
                Steps: {d.steps}
                <br />
                Expected: {d.expected} · Actual: {d.actual} · Environment: {d.environment}
              </li>
            ))}
          </ol>
        </section>
      </div>
    );
  }
  const p = payload as QaCheckout;
  return (
    <div className="space-y-4">
      <section>
        <h3 className="font-bold">Test cases</h3>
        <ol className="list-decimal space-y-2 pl-5">
          {p.testCases.map((t, i) => (
            <li key={i}>
              <strong>{t.title || "(no title)"}</strong> – {t.field || "?"}, {t.technique || "?"}; data: {t.testData || "–"}; steps: {t.steps || "–"}; expected: {t.expected || "–"}
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h3 className="font-bold">Defect reports</h3>
        <ol className="list-decimal space-y-2 pl-5">
          {p.defects.map((d, i) => (
            <li key={i}>
              <strong>{d.title || "(no title)"}</strong> (log entry {d.logEntry || "?"}) – severity {d.severity || "?"}, priority {d.priority || "?"}
              <br />
              Steps: {d.steps || "–"}
              <br />
              Expected: {d.expected || "–"} · Actual: {d.actual || "–"}
              {d.environment ? ` · Environment: ${d.environment}` : ""}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
