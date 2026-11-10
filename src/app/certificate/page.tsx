import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { requireLearner } from "@/server/guards";
import { pathwayStatus } from "@/server/certificate";
import { certificateLines, CERTIFICATE_STATEMENT, type CertificateSnapshot } from "@/lib/certificate/eligibility";
import { issueCertificateAction } from "./actions";
import { Alert, Card, PageHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/forms/form-status";

export const metadata: Metadata = { title: "Certificate of Completion" };

export default async function CertificatePage({ searchParams }: { searchParams: Promise<{ issued?: string; notyet?: string }> }) {
  const user = await requireLearner();
  const sp = await searchParams;
  const roles = await db.pathway.findMany({ where: { kind: "ROLE", status: "PUBLISHED" }, orderBy: { order: "asc" } });
  const certs = await db.certificate.findMany({ where: { userId: user.id, revokedAt: null }, orderBy: { issuedAt: "desc" } });
  const statuses = await Promise.all(roles.map((p) => pathwayStatus(user.id, p.id)));

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Certificate of Completion" intro={`A record of the course work you've completed. ${CERTIFICATE_STATEMENT}`} />
      {sp.issued ? <Alert tone="success">Your certificate is ready.</Alert> : null}
      {sp.notyet ? <Alert tone="warning">You haven&apos;t completed everything needed yet – see the list below.</Alert> : null}

      {certs.map((c) => {
        const s = c.snapshot as unknown as CertificateSnapshot;
        return (
          <Card key={c.id} className="space-y-2" data-testid="certificate">
            {certificateLines(s).map((l, i) => (
              <p key={i} className={i === 0 ? "text-2xl font-bold" : i === certificateLines(s).length - 1 ? "font-bold" : ""}>
                {l}
              </p>
            ))}
            <p className="text-sm text-muted">Verification ID: {c.verificationId}</p>
            <div className="flex flex-wrap gap-3">
              <a href={`/api/certificate/pdf?id=${c.verificationId}`} className={buttonVariants()} download>
                Download PDF
              </a>
              <Link href={`/verify/${c.verificationId}`} className={buttonVariants({ variant: "secondary" })}>
                Public verification page
              </Link>
            </div>
          </Card>
        );
      })}

      {statuses.map(({ pathway, eligibility }) =>
        certs.some((c) => c.pathwayId === pathway.id) ? null : (
          <Card key={pathway.id} className="space-y-2">
            <h2 className="text-xl font-bold">{pathway.title} pathway</h2>
            {eligibility.eligible ? (
              <form action={issueCertificateAction}>
                <input type="hidden" name="pathwayId" value={pathway.id} />
                <p className="mb-2">You&apos;ve completed everything that&apos;s currently available. Well done.</p>
                <SubmitButton>Create my certificate</SubmitButton>
              </form>
            ) : (
              <>
                <p>To get a certificate for this pathway:</p>
                <ul className="list-disc pl-5" data-testid="certificate-missing">
                  {eligibility.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        ),
      )}
    </div>
  );
}
