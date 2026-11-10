import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Glossary" };

export default async function GlossaryPage() {
  const terms = await db.glossaryTerm.findMany({ orderBy: { term: "asc" } });
  return (
    <div className="max-w-3xl">
      <PageHeader title="Glossary" intro="Plain-English meanings of the terms used on this course." />
      <dl className="space-y-4">
        {terms.map((t) => (
          <div key={t.id} id={t.slug}>
            <dt className="font-bold">
              <Link href={`/glossary/${t.slug}`}>{t.term}</Link>
            </dt>
            <dd>{t.definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
