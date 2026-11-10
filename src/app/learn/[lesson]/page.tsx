import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { getPublishedLesson, lessonSections } from "@/server/learning";
import { LESSON_PARTS } from "@/lib/content/lesson-parts";
import { neighbours, resolveResumeKey } from "@/lib/lesson/resume";
import { markdownToSpeech, renderMarkdown } from "@/lib/lesson/markdown";
import { toPublic, toSnapshot } from "@/lib/assessment/snapshot";
import { randomSeed } from "@/lib/random";
import { buttonVariants } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/forms/form-status";
import { PositionSaver } from "@/components/lesson/position-saver";
import { ReadAloud } from "@/components/lesson/read-aloud";
import { PracticeQuestion } from "@/components/quiz/practice-question";
import {
  addNoteAction,
  checkPracticeAnswerAction,
  completeLessonAction,
  deleteNoteAction,
  toggleBookmarkAction,
} from "./actions";

type Props = { params: Promise<{ lesson: string }>; searchParams: Promise<{ section?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = await getPublishedLesson((await params).lesson);
  return { title: lesson?.publishedVersion.title ?? "Lesson" };
}

export default async function LessonPage({ params, searchParams }: Props) {
  const user = await requireLearner();
  const { lesson: slug } = await params;
  const { section } = await searchParams;
  const lesson = await getPublishedLesson(slug);
  if (!lesson) notFound();
  const version = lesson.publishedVersion;
  const sections = lessonSections(version);
  const keys = sections.map((s) => s.key as string);

  const progress = await db.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } } });
  if (!section || !keys.includes(section)) {
    let previousKeys: string[] = [];
    if (progress?.lastVersionId && progress.lastVersionId !== version.id) {
      const old = await db.lessonVersion.findUnique({ where: { id: progress.lastVersionId }, select: { sections: true } });
      previousKeys = old ? lessonSections(old).map((s) => s.key) : [];
    }
    redirect(`/learn/${slug}?section=${resolveResumeKey(keys, progress?.lastSectionKey, previousKeys)}`);
  }

  const current = sections.find((s) => s.key === section)!;
  const index = keys.indexOf(section);
  const { prev, next } = neighbours(keys, section);
  const partLabel = (key: string) => LESSON_PARTS.find((p) => p.key === key)?.label ?? key;

  const [notes, bookmark, glossary, kcQuestions] = await Promise.all([
    db.note.findMany({ where: { userId: user.id, lessonId: lesson.id }, orderBy: { createdAt: "desc" } }),
    db.bookmark.findUnique({ where: { userId_lessonId_sectionKey: { userId: user.id, lessonId: lesson.id, sectionKey: section } } }),
    section === "glossary" ? db.glossaryTerm.findMany({ where: { firstLessonId: lesson.id }, orderBy: { term: "asc" } }) : [],
    section === "knowledge-check" && version.knowledgeCheck
      ? db.question.findMany({
          where: { bank: { slug: version.knowledgeCheck }, active: true, draft: false },
          orderBy: { key: "asc" },
        })
      : [],
  ]);
  const practice = kcQuestions.map((q) => {
    const seed = randomSeed();
    return { seed, q: toPublic(toSnapshot(q, seed)) };
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <PositionSaver lessonId={lesson.id} sectionKey={section} versionId={version.id} />
      <aside aria-label="Lesson sections" className="lg:order-none">
        <p className="text-sm text-muted">
          <Link href={`/pathways/${lesson.module.pathway.slug}/${lesson.module.slug}`}>{lesson.module.title}</Link>
        </p>
        <nav aria-label="Parts of this lesson" className="mt-2">
          <ol className="space-y-1">
            {sections.map((s, i) => (
              <li key={s.key}>
                <Link
                  href={`/learn/${slug}?section=${s.key}`}
                  aria-current={s.key === section ? "step" : undefined}
                  className={
                    s.key === section
                      ? "block rounded-md bg-primary-soft px-2 py-1 font-bold no-underline"
                      : "block rounded-md px-2 py-1 no-underline hover:underline"
                  }
                >
                  {i + 1}. {partLabel(s.key)}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <p className="mt-3 text-sm text-muted">About {version.estimatedMinutes} minutes. Your place is saved automatically.</p>
      </aside>

      <article className="min-w-0 space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold text-muted">
            Part {index + 1} of {sections.length}: {partLabel(section)}
          </p>
          <h1 className="text-2xl font-bold sm:text-3xl">{version.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <form action={toggleBookmarkAction}>
              <input type="hidden" name="lessonId" value={lesson.id} />
              <input type="hidden" name="sectionKey" value={section} />
              <SubmitButton variant="ghost" size="sm" aria-pressed={!!bookmark}>
                {bookmark ? "Remove bookmark" : "Bookmark this section"}
              </SubmitButton>
            </form>
            {user.accessibility?.readAloud ? <ReadAloud text={`${current.title}. ${markdownToSpeech(current.markdown)}`} /> : null}
          </div>
        </header>

        <section aria-labelledby="section-title" className="space-y-4">
          <h2 id="section-title" className="text-xl font-bold">
            {current.title}
          </h2>
          <div className="prose-lesson" dangerouslySetInnerHTML={{ __html: renderMarkdown(current.markdown) }} />

          {section === "glossary" ? (
            <dl className="space-y-3">
              {glossary.map((t) => (
                <div key={t.id}>
                  <dt className="font-bold">
                    <Link href={`/glossary/${t.slug}`}>{t.term}</Link>
                  </dt>
                  <dd>{t.definition}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {section === "knowledge-check" ? (
            practice.length > 0 ? (
              <div className="space-y-4">
                {practice.map((p, i) => (
                  <PracticeQuestion
                    key={p.q.questionId}
                    q={p.q}
                    seed={p.seed}
                    number={i + 1}
                    total={practice.length}
                    check={checkPracticeAnswerAction}
                  />
                ))}
              </div>
            ) : (
              <Alert>There are no questions for this lesson yet.</Alert>
            )
          ) : null}
        </section>

        <nav aria-label="Previous and next part" className="flex flex-wrap justify-between gap-3 border-t border-border pt-4">
          {prev ? (
            <Link href={`/learn/${slug}?section=${prev}`} className={buttonVariants({ variant: "secondary" })}>
              ← Previous: {partLabel(prev)}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/learn/${slug}?section=${next}`} className={buttonVariants()}>
              Next: {partLabel(next)} →
            </Link>
          ) : (
            <form action={completeLessonAction}>
              <input type="hidden" name="lessonId" value={lesson.id} />
              <SubmitButton pendingText="Saving…">
                {progress?.contentCompletedAt ? "Finish and go back to the module" : "Mark lesson as complete"}
              </SubmitButton>
            </form>
          )}
        </nav>

        <Card>
          <h2 className="text-lg font-bold">Your notes for this lesson</h2>
          <form action={addNoteAction} className="mt-3 space-y-2">
            <input type="hidden" name="lessonId" value={lesson.id} />
            <input type="hidden" name="sectionKey" value={section} />
            <label htmlFor="note-body" className="block font-semibold">
              Add a note
            </label>
            <Textarea id="note-body" name="body" maxLength={5000} required className="min-h-20" />
            <SubmitButton variant="secondary" size="sm">
              Save note
            </SubmitButton>
          </form>
          {notes.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="rounded-md border border-border p-3">
                  <p className="text-sm text-muted">
                    {n.sectionKey ? partLabel(n.sectionKey) : "Lesson"} · {n.createdAt.toLocaleDateString("en-GB")}
                  </p>
                  <p className="whitespace-pre-wrap">{n.body}</p>
                  <form action={deleteNoteAction} className="mt-1">
                    <input type="hidden" name="noteId" value={n.id} />
                    <input type="hidden" name="back" value={`/learn/${slug}`} />
                    <button type="submit" className="text-sm text-primary underline">
                      Delete note
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      </article>
    </div>
  );
}
