import "server-only";
import crypto from "node:crypto";
import { db } from "./db";
import { certificateEligibility, verificationId, type CertificateSnapshot, type ModuleStatus } from "@/lib/certificate/eligibility";

/** Foundations plus the role pathway's available modules, with the learner's status in each. */
export async function pathwayStatus(userId: string, pathwayId: string) {
  const pathway = await db.pathway.findUniqueOrThrow({ where: { id: pathwayId } });
  const modules = await db.module.findMany({
    where: { status: "PUBLISHED", availability: "AVAILABLE", OR: [{ pathwayId }, { pathway: { kind: "SHARED", status: "PUBLISHED" } }] },
    orderBy: [{ pathway: { order: "asc" } }, { order: "asc" }],
    include: {
      lessons: { where: { publishedVersionId: { not: null } }, select: { progress: { where: { userId } } } },
      assessments: { where: { status: "PUBLISHED", kind: "MODULE" }, include: { statuses: { where: { userId } } } },
      assignments: { where: { status: "PUBLISHED" }, include: { competencies: { where: { userId }, orderBy: { demonstratedAt: "asc" } } } },
    },
  });
  const status: ModuleStatus[] = modules.map((m) => ({
    title: m.title,
    lessons: { total: m.lessons.length, completed: m.lessons.filter((l) => l.progress[0]?.contentCompletedAt).length },
    assessments: m.assessments.map((a) => ({ title: a.title, passedAt: a.statuses[0]?.passedAt ?? null })),
    assignments: m.assignments.map((a) => ({ title: a.title, demonstratedAt: a.competencies[0]?.demonstratedAt ?? null, assessedBy: a.competencies[0]?.assessedBy })),
  }));
  return { pathway, status, eligibility: certificateEligibility(status) };
}

export async function issueCertificate(userId: string, pathwayId: string) {
  const existing = await db.certificate.findFirst({ where: { userId, pathwayId, revokedAt: null } });
  if (existing) return existing;
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const { pathway, status, eligibility } = await pathwayStatus(userId, pathwayId);
  if (!eligibility.eligible) return null;
  const snapshot: CertificateSnapshot = {
    name: user.displayName,
    pathway: pathway.title,
    modules: status.map((m) => m.title),
    assessments: status.flatMap((m) => m.assessments.map((a) => ({ title: a.title, passedAt: a.passedAt!.toISOString() }))),
    competencies: status.flatMap((m) => m.assignments.map((a) => ({ title: a.title, demonstratedAt: a.demonstratedAt!.toISOString(), assessedBy: a.assessedBy }))),
    issuedAt: new Date().toISOString(),
  };
  const rand = () => crypto.randomInt(0, 1_000_000) / 1_000_000;
  for (let i = 0; i < 5; i++) {
    const id = verificationId(rand);
    if (!(await db.certificate.findUnique({ where: { verificationId: id } }))) {
      return db.certificate.create({ data: { userId, pathwayId, verificationId: id, snapshot: snapshot as object } });
    }
  }
  throw new Error("Could not create a unique verification ID");
}
