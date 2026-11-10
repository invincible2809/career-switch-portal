// Hint-first rules (SPEC §9): the coach doesn't hand over answers to assessed questions
// or write assignments for learners.
import { overlap } from "./text";

const ASSIGNMENT_ASKS = [
  /\b(write|do|complete|finish|make)\b.*\b(my|the)\b.*\b(assignment|diagnosis|impediment log|retro(spective)? plan|test cases?|defect reports?)\b/i,
  /\b(give|tell|send)\b.*\b(me )?(the )?answers?\b/i,
  /\bwhat('s| is) the (right |correct )?answer\b/i,
  /\bwhich (one|option) is (right|correct)\b/i,
];

export type GuardResult = { kind: "ok" } | { kind: "assessed-question"; similarity: number } | { kind: "assignment-request" };

export function checkRequest(question: string, assessedStems: readonly string[]): GuardResult {
  if (ASSIGNMENT_ASKS.some((r) => r.test(question))) return { kind: "assignment-request" };
  let best = 0;
  for (const stem of assessedStems) best = Math.max(best, overlap(stem, question));
  // Most of an assessed question's words appear in the learner's message.
  if (best >= 0.75) return { kind: "assessed-question", similarity: best };
  return { kind: "ok" };
}
