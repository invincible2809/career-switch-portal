// The nine parts every lesson has, in order (SPEC §6).
export const LESSON_PARTS = [
  { key: "objective", label: "Learning objective" },
  { key: "explanation", label: "Explanation" },
  { key: "glossary", label: "New terms" },
  { key: "workplace-example", label: "At ShopEasy" },
  { key: "worked-example", label: "Worked example" },
  { key: "guided-practice", label: "Guided practice" },
  { key: "challenge", label: "Your turn" },
  { key: "knowledge-check", label: "Check your understanding" },
  { key: "next-step", label: "Feedback and next step" },
] as const;

export type LessonPartKey = (typeof LESSON_PARTS)[number]["key"];
export const LESSON_PART_KEYS: readonly string[] = LESSON_PARTS.map((p) => p.key);

export interface LessonSection {
  key: LessonPartKey;
  title: string;
  markdown: string;
}
