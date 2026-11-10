// Rubric evaluation (SPEC §7). Pure: decides the official score for each criterion and whether
// "competency demonstrated" is met. Self-assessment never counts (CLAUDE.md rule 5).
export type ScoreSource = "SELF" | "AUTOMATED" | "GUIDANCE" | "ASSESSOR";

export interface ScoreRow {
  criterionId: string;
  score: number;
  source: ScoreSource;
  createdAt: Date;
}

export interface MinimumRule {
  minEach: number;
}

export interface Evaluation {
  official: Map<string, { score: number; source: "AUTOMATED" | "ASSESSOR" }>;
  awaiting: string[]; // criterion ids without an official score
  complete: boolean;
  met: boolean;
  below: string[]; // criterion ids scored below the minimum
  assessedBy: "AUTOMATED" | "ASSESSOR";
}

export function evaluateRubric(criterionIds: readonly string[], scores: readonly ScoreRow[], rule: MinimumRule): Evaluation {
  const official = new Map<string, { score: number; source: "AUTOMATED" | "ASSESSOR" }>();
  for (const id of criterionIds) {
    const latest = (source: ScoreSource) =>
      scores.filter((s) => s.criterionId === id && s.source === source).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    // An assessor's score overrides an automated one. SELF and GUIDANCE never count.
    const pick = latest("ASSESSOR") ?? latest("AUTOMATED");
    if (pick) official.set(id, { score: pick.score, source: pick.source as "AUTOMATED" | "ASSESSOR" });
  }
  const awaiting = criterionIds.filter((id) => !official.has(id));
  const below = [...official].filter(([, v]) => v.score < rule.minEach).map(([id]) => id);
  const complete = awaiting.length === 0;
  return {
    official,
    awaiting,
    complete,
    met: complete && below.length === 0,
    below,
    assessedBy: [...official.values()].some((v) => v.source === "ASSESSOR") ? "ASSESSOR" : "AUTOMATED",
  };
}
