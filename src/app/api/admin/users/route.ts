import { db } from "@/server/db";
import { adminApiGuard } from "@/server/guards";

export async function GET() {
  const guard = await adminApiGuard("users:manage");
  if (guard instanceof Response) return guard;
  const users = await db.user.findMany({ select: { id: true, email: true, displayName: true, role: true, createdAt: true } });
  return Response.json({ users });
}
