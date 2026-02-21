import "dotenv/config";
import "./server";
import { mayaQueue } from "./infrastructure/mayaQueue";

async function scheduleJobs() {
  await mayaQueue.add("full-cycle", {}, { repeat: { pattern: "0 2 * * *" } });
  await mayaQueue.add("strategy", {}, { repeat: { pattern: "0 3 * * *" } });
  await mayaQueue.add("growth", {}, { repeat: { pattern: "0 4 * * *" } });
  await mayaQueue.add("advanced-intel", {}, { repeat: { pattern: "0 5 * * *" } });
}

void scheduleJobs();
