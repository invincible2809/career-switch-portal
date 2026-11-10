import { shuffle, type Rng } from "../random";

export interface DrawCandidate {
  id: string;
  key: string;
  objective: string;
}

/**
 * Picks `count` questions for a new attempt (PLAN A5):
 * - never-seen questions first, then the ones seen longest ago
 * - among equally fresh questions, objectives are spread out so one topic doesn't dominate
 * `lastSeen` maps question key -> time (ms) it was last shown to this learner.
 */
export function drawQuestions<T extends DrawCandidate>(
  pool: readonly T[],
  lastSeen: ReadonlyMap<string, number>,
  count: number,
  rng: Rng,
): T[] {
  const seen = (q: T) => lastSeen.get(q.key) ?? Number.NEGATIVE_INFINITY;
  // Shuffle first so ties are broken randomly; Array.sort is stable.
  const remaining = shuffle(rng, pool).sort((a, b) => seen(a) - seen(b));
  const picked: T[] = [];
  const perObjective = new Map<string, number>();
  const n = Math.min(count, pool.length);

  while (picked.length < n) {
    const freshest = seen(remaining[0]);
    let bestIndex = 0;
    for (let i = 0; i < remaining.length && seen(remaining[i]) === freshest; i++) {
      const used = perObjective.get(remaining[i].objective) ?? 0;
      const bestUsed = perObjective.get(remaining[bestIndex].objective) ?? 0;
      if (used < bestUsed) bestIndex = i;
    }
    const [q] = remaining.splice(bestIndex, 1);
    picked.push(q);
    perObjective.set(q.objective, (perObjective.get(q.objective) ?? 0) + 1);
  }
  return shuffle(rng, picked);
}

/** Minutes left before another attempt may start (0 = may start now). */
export function cooldownRemaining(lastSubmittedAt: Date | null, cooldownMinutes: number, now: Date): number {
  if (!lastSubmittedAt || cooldownMinutes <= 0) return 0;
  const readyAt = lastSubmittedAt.getTime() + cooldownMinutes * 60_000;
  return Math.max(0, Math.ceil((readyAt - now.getTime()) / 60_000));
}
