import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
import { PrismaClient } from "../../../src/generated/prisma/client";
import type { QuestionSnapshot } from "../../../src/lib/assessment/types";

export const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL! }) });

export const PASSWORD = "CorrectHorse42!";
let counter = 0;
export const uniqueEmail = (label: string) => `${label}-${Date.now()}-${counter++}@test.local`;

/** A learner who has already finished onboarding (fast setup for tests that aren't about onboarding). */
export async function createLearner(label = "learner", pathway: "qa-tester" | "scrum-master" = "qa-tester") {
  const email = uniqueEmail(label);
  const p = await db.pathway.findUniqueOrThrow({ where: { slug: pathway } });
  const user = await db.user.create({
    data: {
      email,
      displayName: `Test ${label}`,
      passwordHash: await hash(PASSWORD),
      accessibility: { create: {} },
      profile: {
        create: { preferredPathway: "QA_TESTER", techConfidence: 3, weeklyMinutes: 120, activePathwayId: p.id, onboardingCompletedAt: new Date() },
      },
    },
  });
  return { ...user, password: PASSWORD };
}

export async function markLessonComplete(userId: string, lessonSlug: string) {
  const lesson = await db.lesson.findUniqueOrThrow({ where: { slug: lessonSlug } });
  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
    create: { userId, lessonId: lesson.id, lastSectionKey: "next-step", lastVersionId: lesson.publishedVersionId, contentCompletedAt: new Date() },
    update: { contentCompletedAt: new Date() },
  });
}

export async function attemptSnapshots(attemptId: string) {
  const answers = await db.attemptAnswer.findMany({ where: { attemptId }, orderBy: { position: "asc" } });
  return answers.map((a) => ({ id: a.id, snapshot: a.snapshot as unknown as QuestionSnapshot }));
}

export async function setPassMark(slug: string, passMark: number) {
  await db.assessment.update({ where: { slug }, data: { passMark } });
}
