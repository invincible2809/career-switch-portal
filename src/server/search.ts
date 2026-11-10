import "server-only";
import { db } from "./db";

export interface SearchResult {
  kind: "lesson" | "glossary";
  title: string;
  href: string;
  snippet: string;
}

/** Postgres full-text search over published lessons, plus glossary matches (PLAN A16). */
export async function search(query: string): Promise<SearchResult[]> {
  const q = query.trim().slice(0, 100);
  if (q.length < 2) return [];
  const lessons = await db.$queryRaw<{ slug: string; title: string; snippet: string }[]>`
    SELECT l."slug", v."title",
           ts_headline('english', v."searchText", plainto_tsquery('english', ${q}),
                       'StartSel=«, StopSel=», MaxWords=25, MinWords=10') AS snippet
    FROM "Lesson" l
    JOIN "LessonVersion" v ON v."id" = l."publishedVersionId"
    JOIN "Module" m ON m."id" = l."moduleId"
    WHERE m."availability" = 'AVAILABLE' AND m."status" = 'PUBLISHED'
      AND to_tsvector('english', v."searchText") @@ plainto_tsquery('english', ${q})
    ORDER BY ts_rank(to_tsvector('english', v."searchText"), plainto_tsquery('english', ${q})) DESC
    LIMIT 20`;
  const terms = await db.glossaryTerm.findMany({
    where: { OR: [{ term: { contains: q, mode: "insensitive" } }, { definition: { contains: q, mode: "insensitive" } }] },
    orderBy: { term: "asc" },
    take: 20,
  });
  return [
    ...terms.map((t) => ({ kind: "glossary" as const, title: t.term, href: `/glossary/${t.slug}`, snippet: t.definition })),
    ...lessons.map((l) => ({ kind: "lesson" as const, title: l.title, href: `/learn/${l.slug}`, snippet: l.snippet })),
  ];
}
