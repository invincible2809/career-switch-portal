import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { Card, PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Glossary term" };

export default async function GlossaryTermPage({ params }: { params: Promise<{ term: string }> }) {
  const { term } = await params;
  const t = await db.glossaryTerm.findUnique({
    where: { slug: term },
    include: { firstLesson: { select: { slug: true, publishedVersion: { select: { title: true } } } } },
  });
  if (!t) notFound();
  return (
    <div className="max-w-3xl">
      <PageHeader title={t.term} />
      <Card>
        <p className="text-lg">{t.definition}</p>
        {t.firstLesson?.publishedVersion ? (
          <p className="mt-3 text-sm">
            Introduced in:{" "}
            <Link href={`/learn/${t.firstLesson.slug}?section=glossary`}>{t.firstLesson.publishedVersion.title}</Link>
          </p>
        ) : null}
      </Card>
      <p className="mt-4">
        <Link href="/glossary">All glossary terms</Link>
      </p>
    </div>
  );
}
