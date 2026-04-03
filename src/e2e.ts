import { execa, ExecaChildProcess } from "execa";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch("http://localhost:8080/health");
      if (res.ok) return;
    } catch {}

    await sleep(1000);
  }

  throw new Error("Server did not start on port 8080");
}

async function runChecks() {
  console.log("→ Checking /health");

  const health = await fetch("http://localhost:8080/health");
  if (!health.ok) throw new Error("Health check failed");

  console.log("→ Checking auth");

  const auth = await fetch("http://localhost:8080/api/auth/otp/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone: "1234567890" }),
  });

  if (!auth.ok) throw new Error("Auth endpoint failed");

  console.log("→ Checking application submit");

  const appSubmit = await fetch("http://localhost:8080/api/applications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      businessName: "E2E Test Corp",
      amount: 50000,
    }),
  });

  if (!appSubmit.ok) throw new Error("Application submit failed");
}

async function startServer(): Promise<ExecaChildProcess> {
  console.log("→ Starting BF-Server...");

  const server = execa("npm", ["run", "dev"], {
    cwd: "../BF-Server",
    stdout: "inherit",
    stderr: "inherit",
  });

  await waitForServer();

  console.log("→ Server ready");

  return server;
}

async function main() {
  console.log("=== E2E TEST START ===");

  let server: ExecaChildProcess | null = null;

  try {
    server = await startServer();

    await runChecks();

    console.log("=== E2E PASS ===");
    process.exit(0);
  } catch (err: any) {
    console.error("=== E2E FAIL ===");
    console.error(err.message || err);
    process.exit(1);
  } finally {
    if (server) {
      console.log("→ Shutting down server...");
      server.kill("SIGTERM", {
        forceKillAfterTimeout: 2000,
      });
    }
  }
}

main();
