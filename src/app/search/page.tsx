import type { Metadata } from "next";
import Link from "next/link";
import { search } from "@/server/search";
import { requireLearner } from "@/server/guards";
import { Badge, Card, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireLearner();
  const { q = "" } = await searchParams;
  const results = await search(q);
  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader title="Search" intro="Search lessons and the glossary." />
      <form role="search" className="flex flex-wrap gap-2" action="/search">
        <label htmlFor="q" className="sr-only">
          Search lessons and glossary
        </label>
        <Input id="q" name="q" defaultValue={q} className="max-w-md flex-1" maxLength={100} />
        <Button type="submit">Search</Button>
      </form>
      {q.trim().length >= 2 ? (
        <p role="status">
          {results.length} result{results.length === 1 ? "" : "s"} for &quot;{q}&quot;
        </p>
      ) : null}
      <ul className="space-y-3">
        {results.map((r) => (
          <li key={r.href}>
            <Card>
              <Badge tone={r.kind === "lesson" ? "primary" : "neutral"}>{r.kind === "lesson" ? "Lesson" : "Glossary"}</Badge>
              <h2 className="mt-1 font-bold">
                <Link href={r.href}>{r.title}</Link>
              </h2>
              <p className="text-muted">{r.snippet}</p>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
