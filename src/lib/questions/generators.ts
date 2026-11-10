// Deterministic question generators. Like the 11+ bank in the Oakling apps, every
// generated question is built together with its answer, a worked explanation and a
// reason why each wrong option is wrong, so answers are correct by construction and
// no AI service is needed. The same generator + seed always gives the same question.
import { z } from "zod";
import { choice, createRng, sample, shuffle, type Rng } from "../random";
import type { OptionSnapshot, QuestionType } from "../assessment/types";
import { TEAM_ROLES } from "./data/team-roles";

export interface GeneratedQuestion {
  type: QuestionType;
  scenario?: string;
  stem: string;
  options: OptionSnapshot[];
  correctOrder: string[];
}

interface Draft {
  text: string;
  correct: boolean;
  explanation: string;
}

const OPTION_IDS = ["a", "b", "c", "d", "e", "f"];

function withIds(rng: Rng, drafts: Draft[]): OptionSnapshot[] {
  return shuffle(rng, drafts).map((d, i) => ({ id: OPTION_IDS[i], ...d }));
}

// ---- who-does-what: match a ShopEasy task to the role that usually does it ----
const whoDoesWhatParams = z
  .object({
    // Fix the answer to one role so several slots in a bank never repeat each other.
    role: z
      .string()
      .refine((r) => TEAM_ROLES.some((t) => t.role === r), "role must be one of the roles in team-roles.ts")
      .optional(),
  })
  .strict();

function whoDoesWhat(rng: Rng, raw: unknown): GeneratedQuestion {
  const { role } = whoDoesWhatParams.parse(raw);
  const target = role ? TEAM_ROLES.find((t) => t.role === role)! : choice(rng, TEAM_ROLES);
  const duty = choice(rng, target.duties);
  const others = sample(rng, TEAM_ROLES.filter((r) => r !== target), 3);
  return {
    type: "SINGLE",
    stem: `At ShopEasy, someone ${duty}. Which role usually does this?`,
    options: withIds(rng, [
      {
        text: target.role,
        correct: true,
        explanation: `Correct. A ${target.role.toLowerCase()} ${target.summary}.`,
      },
      ...others.map((r) => ({
        text: r.role,
        correct: false,
        explanation: `Not quite. A ${r.role.toLowerCase()} ${r.summary}. This task is usually done by the ${target.role.toLowerCase()}.`,
      })),
    ]),
    correctOrder: [],
  };
}

// ---- bva-values: two-value boundary value analysis on a whole-number range ----
const bvaParams = z
  .object({
    fields: z
      .array(
        z.object({
          label: z.string(), // e.g. "the basket quantity box"
          min: z.number().int(),
          max: z.number().int(),
        }),
      )
      .min(1),
  })
  .strict()
  .refine((p) => p.fields.every((f) => f.max - f.min >= 4), "Each range must span at least 5 values");

function bvaValues(rng: Rng, raw: unknown): GeneratedQuestion {
  const { fields } = bvaParams.parse(raw);
  const { label, min, max } = choice(rng, fields);
  const fmt = (vals: number[]) => vals.join(", ");
  return {
    type: "SINGLE",
    scenario: `At ShopEasy, ${label} accepts whole numbers from ${min} to ${max}. Anything outside that range should be rejected.`,
    stem: "Using two-value boundary value analysis, which set of test values covers every boundary?",
    options: withIds(rng, [
      {
        text: fmt([min - 1, min, max, max + 1]),
        correct: true,
        explanation: `Correct. Each boundary (${min} and ${max}) is tested together with its closest neighbour on the invalid side (${min - 1} and ${max + 1}).`,
      },
      {
        text: fmt([min, max]),
        correct: false,
        explanation: `This only tests the valid boundaries. It misses the closest invalid values, ${min - 1} and ${max + 1}, which is where mistakes like "<" instead of "<=" show up.`,
      },
      {
        text: fmt([min + 1, Math.round((min + max) / 2), max - 1]),
        correct: false,
        explanation: `These are all valid values inside the range. They don't test the edges at ${min} and ${max}, where bugs most often hide.`,
      },
      {
        text: fmt([min - 10, max + 10]),
        correct: false,
        explanation: `These values are invalid, but they're far from the edges. Boundary value analysis tests the values right next to each boundary: ${min - 1}, ${min}, ${max} and ${max + 1}.`,
      },
    ]),
    correctOrder: [],
  };
}

interface GeneratorDef {
  description: string;
  params: z.ZodType;
  build: (rng: Rng, params: unknown) => GeneratedQuestion;
}

export const GENERATORS: Record<string, GeneratorDef> = {
  "who-does-what": {
    description: "Match a ShopEasy task to the tech-team role that usually does it",
    params: whoDoesWhatParams,
    build: whoDoesWhat,
  },
  "bva-values": {
    description: "Pick the two-value boundary value analysis test values for a numeric range",
    params: bvaParams,
    build: bvaValues,
  },
};

export function isKnownGenerator(name: string): boolean {
  return Object.hasOwn(GENERATORS, name);
}

export function validateGeneratorParams(name: string, params: unknown): string | null {
  const def = GENERATORS[name];
  if (!def) return `Unknown generator "${name}". Known: ${Object.keys(GENERATORS).join(", ")}`;
  const r = def.params.safeParse(params ?? {});
  return r.success ? null : r.error.issues.map((i) => i.message).join("; ");
}

export function generateQuestion(name: string, params: unknown, seed: number): GeneratedQuestion {
  const def = GENERATORS[name];
  if (!def) throw new Error(`Unknown generator "${name}"`);
  return def.build(createRng(seed), params ?? {});
}
