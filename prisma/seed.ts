// pnpm db:seed – imports content/ and creates the demo accounts. Safe to run more than once.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { loadContent } from "../src/lib/content/load";
import { importContent } from "../src/server/content-import";
import { hashPassword } from "../src/server/password";

async function main() {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    const content = loadContent();
    const report = await importContent(db, content);

    const demoUsers = [
      { email: "learner@demo.local", displayName: "Demo Learner", role: "LEARNER" as const, password: process.env.DEMO_LEARNER_PASSWORD },
      { email: "admin@demo.local", displayName: "Demo Admin", role: "ADMIN" as const, password: process.env.DEMO_ADMIN_PASSWORD },
    ];
    for (const u of demoUsers) {
      if (!u.password) throw new Error(`Set DEMO_${u.role}_PASSWORD in .env (see .env.example)`);
      if (await db.user.findUnique({ where: { email: u.email } })) continue;
      await db.user.create({
        data: {
          email: u.email,
          displayName: u.displayName,
          role: u.role,
          passwordHash: await hashPassword(u.password),
          accessibility: { create: {} },
          profile: { create: {} },
        },
      });
      report.created.push(`user ${u.email}`);
    }
    console.log(report.created.length ? `Created:\n- ${report.created.join("\n- ")}` : "Nothing new to import.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
