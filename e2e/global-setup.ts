import { execSync } from "child_process";
import path from "path";

export default async function globalSetup() {
  const serverDir = path.resolve(process.cwd(), "server");
  execSync("bunx prisma migrate reset --force", {
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
