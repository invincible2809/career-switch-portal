/**
 * Where a learner should resume a lesson (PLAN A8). Position is stored as a section key,
 * so a new lesson version keeps their place. If the key no longer exists, resume at the
 * nearest earlier section that still exists (using the order of the version they last saw).
 */
export function resolveResumeKey(
  currentKeys: readonly string[],
  savedKey: string | null | undefined,
  previousKeys: readonly string[] = [],
): string {
  if (currentKeys.length === 0) throw new Error("A lesson needs at least one section");
  if (!savedKey) return currentKeys[0];
  if (currentKeys.includes(savedKey)) return savedKey;
  const idx = previousKeys.indexOf(savedKey);
  for (let i = idx - 1; i >= 0; i--) {
    if (currentKeys.includes(previousKeys[i])) return previousKeys[i];
  }
  return currentKeys[0];
}

export function neighbours(keys: readonly string[], key: string): { prev: string | null; next: string | null } {
  const i = keys.indexOf(key);
  return { prev: i > 0 ? keys[i - 1] : null, next: i >= 0 && i < keys.length - 1 ? keys[i + 1] : null };
}
