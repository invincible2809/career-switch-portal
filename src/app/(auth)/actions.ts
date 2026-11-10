"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { db } from "@/server/db";
import { signIn, signOut } from "@/server/auth";
import { hashPassword } from "@/server/password";
import { consumeRateLimit } from "@/server/rate-limit";
import { sendMail } from "@/server/mail";
import {
  fieldErrors,
  forgotSchema,
  loginSchema,
  registerSchema,
  resetSchema,
  type FormState,
} from "@/lib/schemas/auth";

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = { displayName: raw.displayName ?? "", email: raw.email ?? "" };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  if (!(await consumeRateLimit(`register:${await clientIp()}`, 10, 60 * 60 * 1000))) {
    return { error: "Too many accounts created from this connection. Please try again later.", values };
  }
  const { displayName, email, password } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) {
    return { fieldErrors: { email: "An account with this email already exists. Try logging in instead." }, values };
  }
  await db.user.create({
    data: {
      email,
      displayName,
      passwordHash: await hashPassword(password),
      profile: { create: {} },
      accessibility: { create: {} },
    },
  });
  await signIn("credentials", { email, password, redirectTo: "/onboarding" });
  return {};
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = { email: raw.email ?? "" };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const ip = await clientIp();
  const allowed =
    (await consumeRateLimit(`login:email:${parsed.data.email}`, 10, 15 * 60 * 1000)) &&
    // Per-address limit is generous (shared office networks); the per-email limit stops password guessing.
    (await consumeRateLimit(`login:ip:${ip}`, 300, 15 * 60 * 1000));
  if (!allowed) return { error: "Too many attempts. Please wait 15 minutes and try again.", values };
  try {
    await signIn("credentials", { ...parsed.data, redirectTo: safeNext(formData.get("next")) });
  } catch (e) {
    if (e instanceof AuthError) return { error: "The email or password is not right. Check them and try again.", values };
    throw e;
  }
  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login?loggedOut=1" });
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const sameMessage = {
    ok: "If an account exists for that email, we've sent a link to reset the password. The link works for 1 hour.",
  };
  if (!(await consumeRateLimit(`reset:${parsed.data.email}`, 5, 60 * 60 * 1000))) return sameMessage;
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const token = crypto.randomBytes(32).toString("base64url");
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const base = process.env.APP_URL ?? "http://localhost:3000";
    await sendMail(
      user.email,
      "Reset your Career Switch Portal password",
      `Hello ${user.displayName},\n\nUse this link to choose a new password. It works for 1 hour and can only be used once:\n\n${base}/reset-password/${token}\n\nIf you didn't ask for this, you can ignore this email.`,
    );
  }
  return sameMessage;
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "This reset link has expired or has already been used. Please ask for a new one." };
  }
  await db.$transaction([
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.user.update({
      where: { id: record.userId },
      // Bumping the session version signs the account out everywhere.
      data: { passwordHash: await hashPassword(parsed.data.password), sessionVersion: { increment: 1 } },
    }),
  ]);
  redirect("/login?reset=1");
}
