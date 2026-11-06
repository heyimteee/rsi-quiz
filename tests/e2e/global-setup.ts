import { execSync } from "node:child_process";

export default function globalSetup() {
  const env = {
    ...process.env,
    DATABASE_URL: "file:./e2e.db",
    SESSION_SECRET: "rsi-quiz-e2e-secret-0123456789-abcdef",
    DEMO_MODE: "true",
    TZ: "Asia/Jakarta",
  };
  execSync("npx prisma db push --force-reset --skip-generate", {
    stdio: "inherit",
    env,
  });
  execSync("npx prisma db seed", { stdio: "inherit", env });
}
