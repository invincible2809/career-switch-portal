import "server-only";
import { db } from "../db";
import { freshState, type LabState } from "./engine";

/** Each learner has one lab session holding their demo-shop state (never real data). */
export async function loadLab(userId: string): Promise<{ id: string; state: LabState }> {
  const existing = await db.labSession.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
  if (existing) return { id: existing.id, state: { ...freshState(), ...(existing.state as object) } as LabState };
  const created = await db.labSession.create({ data: { userId, state: freshState() as object } });
  return { id: created.id, state: freshState() };
}

export async function saveLab(id: string, state: LabState) {
  await db.labSession.update({ where: { id }, data: { state: state as object } });
}

export async function resetLab(userId: string) {
  await db.labSession.deleteMany({ where: { userId } });
  await db.labSession.create({ data: { userId, state: freshState() as object } });
}
