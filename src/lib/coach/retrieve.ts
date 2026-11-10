// Finds the lesson sections and glossary terms most relevant to a learner's question.
// TF-IDF-style scoring over published lesson sections – no AI service involved.
import { tokens } from "./text";

export interface SectionDoc {
  lessonSlug: string;
  lessonTitle: string;
  sectionKey: string;
  sectionTitle: string;
  text: string;
}

export interface GlossaryDoc {
  slug: string;
  term: string;
  definition: string;
}

export interface Hit {
  doc: SectionDoc;
  score: number;
  excerpt: string;
}

export function rankSections(query: string, docs: readonly SectionDoc[], limit = 3): Hit[] {
  const q = [...new Set(tokens(query))];
  if (q.length === 0) return [];
  const docTokens = docs.map((d) => tokens(`${d.sectionTitle} ${d.text}`));
  const df = new Map<string, number>();
  for (const t of q) df.set(t, docTokens.filter((dt) => dt.includes(t)).length);
  const scored = docs.map((doc, i) => {
    const dt = docTokens[i];
    let score = 0;
    for (const t of q) {
      const tf = dt.filter((x) => x === t).length;
      if (!tf) continue;
      const idf = Math.log(1 + docs.length / (df.get(t) || 1));
      score += (1 + Math.log(tf)) * idf;
    }
    // Prefer explanatory parts over practice prompts.
    if (["explanation", "worked-example", "workplace-example"].includes(doc.sectionKey)) score *= 1.2;
    return { doc, score, excerpt: bestExcerpt(doc.text, q) };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
}

/** The sentence(s) with the most query terms, trimmed to ~60 words. */
export function bestExcerpt(text: string, queryTokens: string[]): string {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z*"(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  if (sentences.length === 0) return text.slice(0, 300);
  let best = 0;
  let bestScore = -1;
  sentences.forEach((s, i) => {
    const st = tokens(s);
    const score = queryTokens.filter((t) => st.includes(t)).length;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  const words = [sentences[best], sentences[best + 1] ?? ""].join(" ").split(" ");
  return words.length > 60 ? `${words.slice(0, 60).join(" ")}…` : words.join(" ").trim();
}

export function matchGlossary(query: string, terms: readonly GlossaryDoc[], limit = 2): GlossaryDoc[] {
  const q = ` ${query.toLowerCase().replace(/[^a-z0-9 ]/g, " ")} `;
  return terms
    .filter((t) => q.includes(` ${t.term.toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim()} `) || q.includes(` ${t.term.toLowerCase()}s `))
    .sort((a, b) => b.term.length - a.term.length)
    .slice(0, limit);
}

/** Plain text of lesson Markdown, for indexing. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, t, l) => l ?? t)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/:::\w*/g, "")
    .replace(/^\s*\|.*\|\s*$/gm, (row) => row.replace(/\|/g, " "))
    .replace(/[#*_>`\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
