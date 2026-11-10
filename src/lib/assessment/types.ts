export type QuestionType = "SINGLE" | "MULTI" | "ORDER" | "SCENARIO";

export interface OptionSnapshot {
  id: string;
  text: string;
  correct: boolean;
  explanation: string;
}

/** Exactly what a learner saw for one question. Stored on every attempt answer. */
export interface QuestionSnapshot {
  questionId: string;
  key: string;
  version: number;
  type: QuestionType;
  scenario?: string;
  stem: string;
  options: OptionSnapshot[];
  /** For ORDER questions: option ids in the correct order. */
  correctOrder: string[];
  objective: string;
  lessonRef: { lessonSlug: string; sectionKey: string };
  generated?: { generator: string; seed: number };
}

/** SINGLE/SCENARIO: one option id. MULTI: option ids. ORDER: option ids in the learner's order. */
export type QuestionResponse = string[];
