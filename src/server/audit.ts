import "server-only";
import { db } from "./db";

export async function audit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  before?: unknown,
  after?: unknown,
) {
  await db.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      before: before === undefined ? undefined : JSON.parse(JSON.stringify(before)),
      after: after === undefined ? undefined : JSON.parse(JSON.stringify(after)),
    },
  });
}
