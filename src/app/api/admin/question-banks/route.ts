import { db } from "@/server/db";
import { adminApiGuard } from "@/server/guards";

export async function GET() {
  const guard = await adminApiGuard("content:edit");
  if (guard instanceof Response) return guard;
  const banks = await db.questionBank.findMany({ include: { questions: true } });
  return Response.json({ banks });
}
