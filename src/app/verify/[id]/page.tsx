import type { Metadata } from "next";
import { db } from "@/server/db";
import { certificateLines, type CertificateSnapshot } from "@/lib/certificate/eligibility";
import { Alert, Card, PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Verify a certificate", robots: { index: false, follow: false } };

/** Public page: anyone with a verification ID can check a certificate's details. */
export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const valid = /^CSP-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(id);
  const cert = valid ? await db.certificate.findUnique({ where: { verificationId: id } }) : null;
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Verify a certificate" />
      {!cert || cert.revokedAt ? (
        <Alert tone="warning" data-testid="verify-result">
          This certificate is no longer available, or the verification ID is wrong. Check the ID and try again.
        </Alert>
      ) : (
        <>
          <Alert tone="success" data-testid="verify-result">
            This is a genuine Certificate of Completion from Career Switch Portal (verification ID {cert.verificationId}).
          </Alert>
          <Card className="space-y-2">
            {certificateLines(cert.snapshot as unknown as CertificateSnapshot).map((l, i) => (
              <p key={i} className={i === 0 ? "text-xl font-bold" : ""}>
                {l}
              </p>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
