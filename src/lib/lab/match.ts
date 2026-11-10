// Compares learner defect reports with the planted Test Lab defects (PLAN A14).
// found = right area and the report's title/expected/actual mention the key behaviour, with
// steps, severity and priority filled in; partly described = right area and partly matches.
export interface ReportForMatching {
  area: string;
  title: string;
  steps: string;
  expected: string;
  actual: string;
  severity: string;
  priority: string;
}

export interface DefectKey {
  key: string;
  area: string;
  title: string;
  keyTerms: string[][];
}

export interface LabMatch {
  reportIndex: number;
  result: "found" | "partly described" | "not matched" | "duplicate";
  defectKey?: string;
  note: string;
}

const groupsMatched = (text: string, d: DefectKey) => d.keyTerms.filter((g) => g.some((t) => text.includes(t.toLowerCase()))).length;

export function matchLabReports(reports: readonly ReportForMatching[], known: readonly DefectKey[]) {
  const matches: LabMatch[] = [];
  const used = new Set<string>();
  reports.forEach((r, i) => {
    const text = ` ${r.title} ${r.expected} ${r.actual} `.toLowerCase();
    const candidates = known
      .filter((d) => d.area === r.area)
      .map((d) => ({ d, n: groupsMatched(text, d) }))
      .filter((c) => c.n > 0)
      .sort((a, b) => b.n - a.n);
    // The strongest match wins; among equally strong ones, prefer a defect not reported yet.
    const top = candidates[0]?.n ?? 0;
    const strongest = candidates.filter((c) => c.n === top);
    const best = strongest.find((c) => !used.has(c.d.key)) ?? strongest[0];
    if (!best) {
      matches.push({
        reportIndex: i,
        result: "not matched",
        note: "this doesn't match a known defect in that area. Check it against the specification, or choose a different area. If you're sure it breaks the specification, keep it – automated matching only knows the planted defects.",
      });
      return;
    }
    if (used.has(best.d.key)) {
      matches.push({ reportIndex: i, result: "duplicate", defectKey: best.d.key, note: "another of your reports already covers this defect." });
      return;
    }
    used.add(best.d.key);
    const complete = r.steps.trim().length >= 3 && r.expected.trim().length >= 3 && r.actual.trim().length >= 3 && !!r.severity && !!r.priority;
    const full = best.n === best.d.keyTerms.length && complete;
    matches.push({
      reportIndex: i,
      result: full ? "found" : "partly described",
      defectKey: best.d.key,
      note: full
        ? "a real defect, clearly described."
        : !complete
          ? "a real defect – add steps to reproduce, a severity and a priority."
          : "a real defect, but say more clearly what was expected and what actually happened.",
    });
  });
  const found = matches.filter((m) => m.result === "found").length;
  const partly = matches.filter((m) => m.result === "partly described").length;
  return { matches, found, partly, missed: known.filter((k) => !used.has(k.key)) };
}
