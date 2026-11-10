import "server-only";
import { db } from "./db";

/**
 * Fixed-window rate limit stored in Postgres (PLAN A15). Atomic: one upsert per call.
 * Returns true if the action is allowed (and counts it), false if the limit is reached.
 */
export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitBucket" ("key", "windowStart", "count") VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."windowStart" = EXCLUDED."windowStart"
                     THEN "RateLimitBucket"."count" + 1 ELSE 1 END,
      "windowStart" = EXCLUDED."windowStart"
    RETURNING "count"`;
  return rows[0].count <= limit;
}
