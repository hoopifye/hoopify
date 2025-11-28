import { execSync } from "child_process";

const branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();

if (branch === "master" || branch === "dev") {
  console.error(`❌ Pushing to "${branch}" is not allowed.`);
  process.exit(1);
}

process.exit(0);
