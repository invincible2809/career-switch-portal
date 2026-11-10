import "server-only";
import nodemailer from "nodemailer";
import { db } from "./db";

/** Demo mode when SMTP isn't configured: messages are stored and shown at /dev/mailbox (SPEC §14). */
export function isMailDemoMode(): boolean {
  return !process.env.SMTP_HOST;
}

/** The demo mailbox page exists only in demo mode, and never in production unless ALLOW_DEMO_MAILBOX=true. */
export function demoMailboxEnabled(): boolean {
  return isMailDemoMode() && (process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_MAILBOX === "true");
}

export async function sendMail(to: string, subject: string, body: string): Promise<void> {
  if (isMailDemoMode()) {
    await db.devMailboxMessage.create({ data: { to, subject, body } });
    console.info(`[demo mailbox] Email to ${to}: ${subject}`);
    return;
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  await transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text: body });
}
