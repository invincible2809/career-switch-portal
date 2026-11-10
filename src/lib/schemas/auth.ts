import { z } from "zod";

export const email = z.string().trim().toLowerCase().email("Enter an email address like name@example.com").max(254);
export const newPassword = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(200, "Use 200 characters or fewer");

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(1, "Enter your name").max(100, "Use 100 characters or fewer"),
    email,
    password: newPassword,
    confirmPassword: z.string(),
    privacy: z.literal("on", { message: "Confirm you have read the privacy notice" }),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "The passwords don't match" });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(200),
});

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({
    token: z.string().min(20).max(200),
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "The passwords don't match" });

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: string;
  values?: Record<string, string>;
};

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
