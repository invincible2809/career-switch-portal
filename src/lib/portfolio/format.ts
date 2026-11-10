// Turns portfolio sources into simple headed sections, used by the page, the share link and the PDF.
import type { QaCheckout, QaTestLab, ScrumRetroPlan } from "../assignments/forms";
import { RETRO_STAGES } from "../assignments/forms";

export const PORTFOLIO_LABEL = "Simulated learning project – not paid work experience";

export interface PortfolioSection {
  heading: string;
  lines: string[];
}

export function submissionSections(formKind: string, payload: unknown): PortfolioSection[] {
  if (formKind === "SCRUM_RETRO_PLAN") {
    const p = payload as ScrumRetroPlan;
    return [
      { heading: "Diagnosis", lines: p.diagnosis.split(/\n+/).filter(Boolean) },
      { heading: "Impediment log", lines: p.impediments.map((i, n) => `${n + 1}. ${i.impediment} – impact: ${i.impact}; owner: ${i.owner}; next step: ${i.nextStep}; status: ${i.status || "–"}`) },
      {
        heading: `Retrospective plan (${p.retroRows.reduce((s, r) => s + (r.minutes || 0), 0)} minutes)`,
        lines: [`Goal: ${p.retroGoal}`, ...p.retroRows.map((r) => `${RETRO_STAGES.find((s) => s.key === r.stage)?.label ?? "Part"} · ${r.minutes} min · ${r.activity}${r.purpose ? ` – ${r.purpose}` : ""}`)],
      },
    ];
  }
  const p = payload as QaTestLab | QaCheckout;
  return [
    {
      heading: "Test cases",
      lines: p.testCases.map((t, n) => `${n + 1}. ${t.title} (${t.technique}) – data: ${t.testData}; expected: ${t.expected}${"status" in t ? `; result: ${String(t.status).replace("_", " ").toLowerCase()}` : ""}`),
    },
    {
      heading: "Defect reports",
      lines: p.defects.map((d, n) => `${n + 1}. ${d.title} – severity ${d.severity || "–"}, priority ${d.priority || "–"}. Expected: ${d.expected} Actual: ${d.actual}`),
    },
  ];
}

export function labSections(cases: { title: string; technique: string; testData: string; status: string; actual: string | null }[], defects: { title: string; area: string; severity: string; priority: string }[]): PortfolioSection[] {
  return [
    { heading: `Test cases (${cases.length})`, lines: cases.map((c, n) => `${n + 1}. ${c.title} (${c.technique}) – data: ${c.testData}; result: ${c.status.replace("_", " ").toLowerCase()}${c.actual ? ` – ${c.actual}` : ""}`) },
    { heading: `Defect reports (${defects.length})`, lines: defects.map((d, n) => `${n + 1}. ${d.title} – ${d.area}, severity ${d.severity}, priority ${d.priority}`) },
  ];
}
