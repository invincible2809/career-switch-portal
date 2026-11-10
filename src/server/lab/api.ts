import "server-only";
import { z } from "zod";
import { getCurrentUser } from "../guards";
import { consumeRateLimit } from "../rate-limit";
import { loadLab, saveLab } from "./session";
import type { LabState, Result } from "./engine";

/** Wraps a mock ShopEasy API handler: learner must be signed in to the portal; state is their own lab session. */
export async function labApi(run: (state: LabState) => Result<unknown> | Promise<Result<unknown>> | { json: unknown; state?: LabState }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not signed in to the portal" }, { status: 401 });
  if (!(await consumeRateLimit(`lab-api:${user.id}`, 300, 60 * 1000))) return Response.json({ error: "Too many requests" }, { status: 429 });
  const lab = await loadLab(user.id);
  const r = await run(lab.state);
  if ("json" in r) {
    if (r.state) await saveLab(lab.id, r.state);
    return Response.json(r.json);
  }
  await saveLab(lab.id, r.state);
  if (!r.ok) return Response.json({ error: r.error }, { status: r.status });
  return Response.json({ ok: true, message: r.message, ...(r.value !== undefined ? { result: r.value } : {}) }, { status: 200 });
}

export async function readJson<T>(request: Request, schema: z.ZodType<T>): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  const body = await request.json().catch(() => undefined);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, response: Response.json({ error: "The request body isn't valid JSON for this endpoint", details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 }) };
  }
  return { ok: true, data: parsed.data };
}
