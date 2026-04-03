import { execa } from "execa";

async function runCommand(cmd: string, args: string[]) {
  try {
    const subprocess = execa(cmd, args, {
      stdio: "inherit",
    });

    await subprocess;
  } catch (err: any) {
    console.error(`Command failed: ${cmd} ${args.join(" ")}`);
    console.error(err.message);
    process.exit(1);
  }
}

async function main() {
  console.log("Agent starting...");

  // enforce node version
  const version = process.version;
  if (!version.startsWith("v20")) {
    console.error(`Invalid Node version: ${version}`);
    process.exit(1);
  }

  // install deps
  await runCommand("npm", ["ci"]);

  // build
  await runCommand("npm", ["run", "build"]);

  // run tests
  await runCommand("npx", ["vitest", "run"]);

  console.log("Agent completed successfully.");
}

main();
