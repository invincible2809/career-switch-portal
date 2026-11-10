import { z } from "zod";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/guards";
import { certificatePdf } from "@/server/pdf/certificate-pdf";
import type { CertificateSnapshot } from "@/lib/certificate/eligibility";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const id = z.string().min(5).max(30).safeParse(new URL(request.url).searchParams.get("id"));
  if (!id.success) return Response.json({ error: "Missing certificate id" }, { status: 400 });
  // Learners can only download their own certificates.
  const cert = await db.certificate.findFirst({ where: { verificationId: id.data, userId: user.id, revokedAt: null } });
  if (!cert) return Response.json({ error: "Not found" }, { status: 404 });
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const pdf = await certificatePdf(cert.snapshot as unknown as CertificateSnapshot, cert.verificationId, `${base}/verify/${cert.verificationId}`);
  return new Response(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="certificate-${cert.verificationId}.pdf"`, "Cache-Control": "no-store" },
  });
}
