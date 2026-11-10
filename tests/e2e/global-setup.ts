import { execSync } from "node:child_process";
import pg from "pg";
import "dotenv/config";

/**
 * Prepares the dedicated e2e database before every run: applies migrations, empties every
 * table and seeds it. As a safety check it only runs against a database whose name ends in
 * "_test" and that isn't the app's own DATABASE_URL.
 */
export default async function globalSetup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set");
  const name = new URL(url).pathname.slice(1);
  if (!name.endsWith("_test") || url === process.env.DATABASE_URL) {
    throw new Error(`Refusing to empty "${name}": the e2e database name must end in "_test" and differ from DATABASE_URL.`);
  }
  const env = { ...process.env, DATABASE_URL: url };
  execSync("pnpm exec prisma migrate deploy", { env, stdio: "inherit" });

  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const { rows } = await client.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`,
  );
  if (rows.length) await client.query(`TRUNCATE ${rows.map((r) => `"${r.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`);
  await client.end();

  execSync("pnpm exec prisma db seed", { env, stdio: "inherit" });
}
