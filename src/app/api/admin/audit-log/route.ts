import { db } from "@/server/db";
import { adminApiGuard } from "@/server/guards";

export async function GET() {
  const guard = await adminApiGuard("audit:read");
  if (guard instanceof Response) return guard;
  const entries = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return Response.json({ entries });
}
