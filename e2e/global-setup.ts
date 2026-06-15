import { execSync } from "child_process";
import path from "path";
import pg from "pg";

export default async function globalSetup() {
  const serverDir = path.resolve(process.cwd(), "server");

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query("DROP SCHEMA IF EXISTS public CASCADE");
  await client.query("CREATE SCHEMA public");
  await client.end();

  execSync("bunx prisma migrate deploy", {
    cwd: serverDir,
    stdio: "inherit",
    env: process.env,
  });

  execSync("bun prisma/seed.ts", {
    cwd: serverDir,
    stdio: "inherit",
    env: process.env,
  });
}
