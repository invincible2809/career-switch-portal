import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { demoMailboxEnabled } from "@/server/mail";
import { Alert, Card, PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Demo mailbox", robots: { index: false } };

export default async function DevMailboxPage() {
  if (!demoMailboxEnabled()) notFound();
  const messages = await db.devMailboxMessage.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  return (
    <div>
      <PageHeader title="Demo mailbox" />
      <Alert tone="warning" className="mb-6">
        <strong>Demo mode – email is not connected.</strong> These emails were not sent to anyone. Set the SMTP settings
        in <code>.env</code> to send real email.
      </Alert>
      {messages.length === 0 ? <p>No emails yet.</p> : null}
      <ul className="space-y-4">
        {messages.map((m) => (
          <li key={m.id}>
            <Card>
              <p className="text-sm text-muted">
                To {m.to} · {m.createdAt.toLocaleString("en-GB")}
              </p>
              <h2 className="font-bold">{m.subject}</h2>
              <pre className="mt-2 whitespace-pre-wrap break-words font-sans">{linkify(m.body)}</pre>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

function linkify(text: string) {
  return text.split(/(https?:\/\/\S+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part}>
        {part}
      </a>
    ) : (
      part
    ),
  );
}
