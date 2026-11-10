import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "./db";
import { getDummyHash, verifyPassword } from "./password";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

// Sessions are JWTs (required by the credentials provider). The token only carries the user id
// and a session version; role and account state are looked up on every request in guards.ts,
// so deleting an account or changing a role ends existing sessions (PLAN §1.2 point 6).
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        if (!user) {
          await verifyPassword(await getDummyHash(), parsed.data.password);
          return null;
        }
        if (!(await verifyPassword(user.passwordHash, parsed.data.password))) return null;
        return { id: user.id, sv: user.sessionVersion } as { id: string };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.sv = (user as { sv?: number }).sv;
      }
      return token;
    },
    session({ session, token }) {
      return { ...session, uid: token.uid as string | undefined, sv: token.sv as number | undefined };
    },
  },
});
