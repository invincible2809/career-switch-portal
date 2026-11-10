import type { Metadata } from "next";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/guards";
import { PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Audit log – Admin" };

export default async function AuditLogPage() {
  await requireAdmin("audit:read");
  const entries = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { actor: { select: { email: true } } } });
  return (
    <div>
      <PageHeader title="Audit log" intro="The latest 200 admin changes." />
      <ol className="space-y-2" data-testid="audit-log">
        {entries.map((e) => (
          <li key={e.id} className="rounded-md border border-border bg-surface p-3">
            <p>
              <strong>{e.action}</strong> on {e.entityType} <code className="break-all">{e.entityId}</code>
            </p>
            <p className="text-sm text-muted">
              {e.actor?.email ?? "deleted user"} · {e.createdAt.toLocaleString("en-GB")}
            </p>
            {e.before || e.after ? (
              <details className="mt-1 text-sm">
                <summary className="cursor-pointer text-primary">Show change</summary>
                <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all">{JSON.stringify({ before: e.before, after: e.after }, null, 2)}</pre>
              </details>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
