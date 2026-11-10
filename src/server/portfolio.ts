import "server-only";
import crypto from "node:crypto";
import { db } from "./db";
import { PORTFOLIO_LABEL, type PortfolioSection } from "@/lib/portfolio/format";

export interface PortfolioView {
  id: string;
  kind: string;
  title: string;
  includeInShare: boolean;
  createdAt: Date;
  competency: string | null;
  sections: PortfolioSection[];
}

export const hashToken = (t: string) => crypto.createHash("sha256").update(t).digest("hex");

/** Items with their live competency status – it's looked up, not stored, so it can't go out of date. */
export async function portfolioItems(userId: string, onlyShared = false): Promise<PortfolioView[]> {
  const items = await db.portfolioItem.findMany({
    where: { userId, ...(onlyShared ? { includeInShare: true } : {}) },
    orderBy: { createdAt: "asc" },
    include: { submission: { include: { competency: true } } },
  });
  return items.map((i) => {
    const c = i.content as { sections?: PortfolioSection[] };
    return {
      id: i.id,
      kind: i.kind,
      title: i.title,
      includeInShare: i.includeInShare,
      createdAt: i.createdAt,
      competency: i.submission
        ? i.submission.competency
          ? i.submission.competency.assessedBy === "ASSESSOR"
            ? "Competency demonstrated – reviewed by an assessor"
            : "Competency demonstrated – automated checks, not reviewed by a person"
          : i.submission.assessmentState === "AWAITING_REVIEW"
            ? "Awaiting assessor review"
            : "Competency not yet demonstrated"
        : null,
      sections: c.sections ?? [],
    };
  });
}

export async function findShare(token: string) {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const share = await db.portfolioShare.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: { select: { id: true, displayName: true } } } });
  if (!share || !share.enabled || share.revokedAt) return null;
  return share;
}

export { PORTFOLIO_LABEL };
