// Pathway and starting-point recommendation (PLAN §1.2 point 8). Rule-based and explainable;
// the learner always makes the final choice.
import { SKILLS_BY_INDUSTRY, type IndustryId, type TransferableSkill } from "./skills-map";

export type RolePathway = "SCRUM_MASTER" | "QA_TESTER";
export type Preference = RolePathway | "HELP_ME_CHOOSE";

export interface DiagnosticSummary {
  /** Fractions 0–1 of correct answers per tag. */
  tech: number;
  logic: number;
  detail: number;
  /** Count of preference answers leaning to each role. */
  leans: Record<RolePathway, number>;
}

export interface RecommendationInput {
  preference: Preference;
  techConfidence: number; // 1–5 self-rated
  industry: IndustryId | null;
  diagnostic: DiagnosticSummary;
}

export interface Recommendation {
  startingPoint: "FOUNDATIONS" | "MODULE_1";
  startingReasons: string[];
  pathway: RolePathway;
  pathwayReasons: string[];
  compared: boolean;
  transferableSkills: TransferableSkill[];
}

export const ROLE_LABEL: Record<RolePathway, string> = {
  SCRUM_MASTER: "Scrum Master",
  QA_TESTER: "QA Tester",
};

export function summariseDiagnostic(
  answers: { tags: string[]; correct: boolean | null; lean?: RolePathway | null }[],
): DiagnosticSummary {
  const frac = (tag: string) => {
    const scored = answers.filter((a) => a.tags.includes(tag) && a.correct !== null);
    return scored.length === 0 ? 0 : scored.filter((a) => a.correct).length / scored.length;
  };
  const leans = { SCRUM_MASTER: 0, QA_TESTER: 0 };
  for (const a of answers) if (a.lean) leans[a.lean]++;
  return { tech: frac("tech"), logic: frac("logic"), detail: frac("detail"), leans };
}

export function recommend(input: RecommendationInput): Recommendation {
  const { diagnostic: d } = input;

  // Starting point: only suggest skipping Foundations when answers AND confidence both say so.
  const canSkip = d.tech >= 0.8 && d.logic >= 0.6 && input.techConfidence >= 4;
  const startingReasons = canSkip
    ? [
        "You answered most of the technology questions correctly and rated your confidence highly.",
        "You could go straight to Module 1. Foundations stays open if you want to check anything.",
      ]
    : [
        d.tech < 0.8
          ? "Some of the technology questions were new to you, which is completely normal at this stage."
          : "You rated your confidence with technology as still growing.",
        "IT Foundations explains how software teams work in plain English, so Module 1 will make more sense.",
      ];

  // Pathway: role-fit score from preference answers, detail and logic results.
  const qaFit = d.leans.QA_TESTER + d.detail * 2 + d.logic;
  const smFit = d.leans.SCRUM_MASTER + 1; // people/facilitation answers carry the Scrum Master case
  let pathway: RolePathway;
  const pathwayReasons: string[] = [];
  const compared = input.preference === "HELP_ME_CHOOSE";

  if (input.preference !== "HELP_ME_CHOOSE") {
    pathway = input.preference;
    pathwayReasons.push(`You chose ${ROLE_LABEL[pathway]}, so your plan starts there.`);
    const other: RolePathway = pathway === "QA_TESTER" ? "SCRUM_MASTER" : "QA_TESTER";
    const otherFit = other === "QA_TESTER" ? qaFit : smFit;
    const ownFit = pathway === "QA_TESTER" ? qaFit : smFit;
    if (otherFit > ownFit + 1) {
      pathwayReasons.push(
        `Your answers also showed strengths that suit ${ROLE_LABEL[other]}. You can switch at any time without losing progress.`,
      );
    }
  } else if (smFit > qaFit) {
    pathway = "SCRUM_MASTER";
    pathwayReasons.push(
      "Your answers showed you enjoy helping groups work well together and sorting out blockers – that's central to the Scrum Master role.",
    );
  } else {
    pathway = "QA_TESTER";
    pathwayReasons.push(
      d.detail >= 0.5
        ? "You did well on the attention-to-detail questions, which matters a lot in testing."
        : "Testing gives you a clear, practical way into software teams, and many people start there.",
    );
  }

  if (pathway === "SCRUM_MASTER") {
    pathwayReasons.push(
      "Honest note: Scrum Master jobs often ask for previous delivery or team experience. Roles like project coordinator or delivery assistant are common stepping stones.",
    );
  } else {
    pathwayReasons.push(
      "Honest note: entry-level testing roles (such as junior manual tester or UAT tester) are a realistic first step, but no course can guarantee a job.",
    );
  }

  const skills = input.industry ? SKILLS_BY_INDUSTRY[input.industry] : SKILLS_BY_INDUSTRY.other;
  const transferableSkills = [...skills].sort(
    (a, b) => Number(b.helpsWith.includes(pathway)) - Number(a.helpsWith.includes(pathway)),
  );

  return {
    startingPoint: canSkip ? "MODULE_1" : "FOUNDATIONS",
    startingReasons,
    pathway,
    pathwayReasons,
    compared,
    transferableSkills,
  };
}

export const ROLE_COMPARISON: Record<RolePathway, { dayToDay: string; skills: string; entryRoutes: string }> = {
  SCRUM_MASTER: {
    dayToDay:
      "Helps a team use Scrum well: facilitates events when needed, removes blockers, coaches the team and the organisation. Does not assign tasks or manage the project.",
    skills: "Facilitation, coaching, listening, handling conflict, helping people improve how they work.",
    entryRoutes:
      "Often reached after working in or near delivery teams – for example project coordinator, delivery or PMO assistant, or team lead.",
  },
  QA_TESTER: {
    dayToDay:
      "Checks that software does what it should, finds and reports problems clearly, and helps the team understand risks.",
    skills: "Attention to detail, curiosity, clear writing, logical thinking, understanding users.",
    entryRoutes: "Junior manual tester, UAT tester, or moving across from a support or service desk role.",
  },
};
