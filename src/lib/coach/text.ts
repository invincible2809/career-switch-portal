// Small text helpers for the rule-based coach: tokenising, light stemming and stop words.
const STOP = new Set(
  "a an and are as at be but by can could do does for from has have how i if in into is it its me my of on or our should so that the their them then there these they this to was we what when where which who why will with would you your about tell explain mean means please".split(" "),
);

export function stem(word: string): string {
  return word
    .replace(/(ies)$/, "y")
    .replace(/(ing|edly|ed|es|s)$/, "")
    .replace(/(.)\1$/, "$1");
}

export function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9£.]+/g) ?? [])
    .map((t) => t.replace(/\.$/, ""))
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map(stem);
}

/** Share of the query's distinct tokens that also appear in the other text (0–1). */
export function overlap(query: string, other: string): number {
  const q = new Set(tokens(query));
  if (q.size === 0) return 0;
  const o = new Set(tokens(other));
  let hit = 0;
  for (const t of q) if (o.has(t)) hit++;
  return hit / q.size;
}
