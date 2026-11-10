import { generateQuestion } from "../questions/generators";
import { createRng, shuffle } from "../random";
import type { OptionSnapshot, QuestionSnapshot, QuestionType } from "./types";

export interface QuestionRow {
  id: string;
  key: string;
  version: number;
  type: QuestionType;
  scenario: string | null;
  stem: string;
  options: unknown;
  correctOrder: string[];
  objective: string;
  lessonSlug: string;
  sectionKey: string;
  generator: string | null;
  generatorParams: unknown;
}

/** Freezes what the learner will see. Generated questions are built from the seed. */
export function toSnapshot(q: QuestionRow, seed: number): QuestionSnapshot {
  const base = {
    questionId: q.id,
    key: q.key,
    version: q.version,
    objective: q.objective,
    lessonRef: { lessonSlug: q.lessonSlug, sectionKey: q.sectionKey },
  };
  if (q.generator) {
    const g = generateQuestion(q.generator, q.generatorParams, seed);
    return { ...base, ...g, generated: { generator: q.generator, seed } };
  }
  return {
    ...base,
    type: q.type,
    scenario: q.scenario ?? undefined,
    stem: q.stem,
    // Option order is shuffled per seed so the right answer isn't always in the same place.
    // Ids stay the same, so marking is unaffected. ORDER questions keep their (already jumbled) order.
    options: (q.type === "ORDER" ? (x: OptionSnapshot[]) => x : (x: OptionSnapshot[]) => shuffle(createRng(seed), x))(
      (q.options as OptionSnapshot[]).map(({ id, text, correct, explanation }) => ({ id, text, correct: !!correct, explanation })),
    ),
    correctOrder: q.correctOrder,
  };
}

/** What is safe to send to the browser before the learner answers: no correctness, no explanations. */
export interface PublicQuestion {
  questionId: string;
  type: QuestionType;
  scenario?: string;
  stem: string;
  options: { id: string; text: string }[];
}

export function toPublic(s: QuestionSnapshot): PublicQuestion {
  return {
    questionId: s.questionId,
    type: s.type,
    scenario: s.scenario,
    stem: s.stem,
    options: s.options.map(({ id, text }) => ({ id, text })),
  };
}
