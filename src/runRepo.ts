import { execa } from "execa";

export async function runRepo(path: string) {
  console.log(`Running repo at ${path}`);

  await execa("npm", ["ci"], { cwd: path, stdio: "inherit" });
  await execa("npm", ["run", "build"], { cwd: path, stdio: "inherit" });
  await execa("npx", ["vitest", "run"], { cwd: path, stdio: "inherit" });
}
