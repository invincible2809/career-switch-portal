"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireLearner } from "@/server/guards";
import { issueCertificate } from "@/server/certificate";

export async function issueCertificateAction(formData: FormData) {
  const user = await requireLearner();
  const pathwayId = z.string().min(1).max(50).parse(formData.get("pathwayId"));
  const cert = await issueCertificate(user.id, pathwayId);
  revalidatePath("/certificate");
  redirect(cert ? "/certificate?issued=1" : "/certificate?notyet=1");
}
