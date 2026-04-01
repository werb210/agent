import { checkHealth } from "../health";

export async function runLoadTest(): Promise<{
  iterations: number;
  durationMs: number;
  status: "ok";
}> {
  const iterations = Number(process.env.LOAD_TEST_ITERATIONS ?? 50);
  const start = Date.now();

  for (let index = 0; index < iterations; index += 1) {
    await checkHealth();
  }

  return {
    iterations,
    durationMs: Date.now() - start,
    status: "ok"
  };
}
