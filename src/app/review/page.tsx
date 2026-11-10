import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { toPublic, toSnapshot } from "@/lib/assessment/snapshot";
import { randomSeed } from "@/lib/random";
import { Alert, PageHeader } from "@/components/ui/card";
import { PracticeQuestion } from "@/components/quiz/practice-question";
import { checkReviewAnswerAction } from "./actions";

export const metadata: Metadata = { title: "Quick review" };

export default async function ReviewPage() {
  const user = await requireLearner();
  const due = await db.reviewItem.findMany({
    where: { userId: user.id, retiredAt: null, dueAt: { lte: new Date() } },
    orderBy: { dueAt: "asc" },
    take: 5,
    include: { question: true },
  });
  const upcoming = await db.reviewItem.count({ where: { userId: user.id, retiredAt: null, dueAt: { gt: new Date() } } });
  const items = due.map((d) => {
    const seed = randomSeed();
    const snap = toSnapshot(d.question, seed);
    return { seed, q: toPublic(snap), lessonRef: snap.lessonRef };
  });
  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader
        title="Quick review"
        intro="Questions you found tricky come back after about 1, 3, 7 and 21 days. A few minutes now helps them stick."
      />
      {items.length === 0 ? (
        <Alert>
          Nothing to review right now.{" "}
          {upcoming > 0 ? `${upcoming} question${upcoming === 1 ? " is" : "s are"} scheduled for later.` : ""}{" "}
          <Link href="/dashboard">Back to your dashboard</Link>
        </Alert>
      ) : (
        items.map((i, n) => (
          <PracticeQuestion
            key={i.q.questionId}
            q={i.q}
            seed={i.seed}
            number={n + 1}
            total={items.length}
            check={checkReviewAnswerAction}
            lessonLink={{ href: `/learn/${i.lessonRef.lessonSlug}?section=${i.lessonRef.sectionKey}`, label: "Look at the lesson section again" }}
          />
        ))
      )}
    </div>
  );
}
