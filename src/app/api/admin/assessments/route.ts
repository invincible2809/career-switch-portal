import { z } from "zod";
import { db } from "@/server/db";
import { adminApiGuard } from "@/server/guards";
import { updateAssessment } from "@/server/admin/content";

export async function GET() {
  const guard = await adminApiGuard("assessment:configure");
  if (guard instanceof Response) return guard;
  return Response.json({ assessments: await db.assessment.findMany() });
}

/** PATCH { id, passMark, drawCount, cooldownMinutes, status } – same rules as the admin form. */
export async function PATCH(request: Request) {
  const guard = await adminApiGuard("assessment:configure");
  if (guard instanceof Response) return guard;
  const body = await request.json().catch(() => null);
  const parsed = z.object({ id: z.string().min(1) }).passthrough().safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });
  const r = await updateAssessment(parsed.data.id, guard.id, parsed.data);
  if (!r.ok) return Response.json({ error: "message" in r ? r.message : r.error.issues }, { status: 400 });
  return Response.json({ ok: true });
}
