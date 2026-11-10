// Rule-based feedback on a mock interview answer: key points covered and STAR structure.
import type { InterviewQuestion } from "./schemas";

export interface InterviewFeedback {
  covered: string[];
  missing: string[];
  star: { situation: boolean; task: boolean; action: boolean; result: boolean };
  wordCount: number;
  tips: string[];
}

const has = (text: string, terms: readonly string[]) => terms.some((t) => text.includes(t.toLowerCase()));

export function interviewFeedback(q: InterviewQuestion, answer: string): InterviewFeedback {
  // Normalise curly apostrophes (phones and Macs type them) and punctuation before matching.
  const text = ` ${answer.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[.,;:!?()]/g, " ").replace(/\s+/g, " ")} `;
  const covered = q.keyPoints.filter((k) => has(text, k.terms)).map((k) => k.label);
  const missing = q.keyPoints.filter((k) => !has(text, k.terms)).map((k) => k.label);
  const star = {
    situation: has(text, ["when ", "situation", "at the time", "once ", "last year", "in my role", "in my last job", "at work"]),
    task: has(text, ["task", "needed to", "had to", "my job was", "responsible", "goal"]),
    action: has(text, [" i asked", " i explained", " i arranged", " i spoke", " i suggested", " i checked", " i set up", " i did", " i made", " i would"]),
    result: has(text, ["result", "outcome", "as a result", "in the end", "which meant", "learned", "learnt", "afterwards"]),
  };
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const tips: string[] = [];
  if (wordCount < 40) tips.push("Your answer is quite short. Aim for around 100–200 words – about a minute when spoken.");
  if (wordCount > 350) tips.push("Your answer is long. Interviewers value focus – try to keep it to the most relevant points.");
  if (missing.length) tips.push(`Consider covering: ${missing.join("; ")}.`);
  const starMissing = Object.entries(star).filter(([, v]) => !v).map(([k]) => k);
  if (starMissing.length && starMissing.length < 4) tips.push(`For examples, the STAR structure helps. You could say more about the ${starMissing.join(", ")}.`);
  if (!tips.length) tips.push("This covers the main points with a clear structure. Practise saying it out loud.");
  return { covered, missing, star, wordCount, tips };
}
