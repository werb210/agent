import { Worker } from "bullmq";
import { redisConnection } from "./redis";
import { runAdvancedIntelligence, runFullMayaCycle } from "../core/mayaOrchestrator";
import { generateStrategicPlan } from "../services/strategyEngine";
import { autonomousGrowthCycle } from "../services/autonomousGrowth";

new Worker(
  "maya-jobs",
  async (job) => {
    switch (job.name) {
      case "full-cycle":
        await runFullMayaCycle();
        break;

      case "strategy":
        await generateStrategicPlan();
        break;

      case "growth":
        await autonomousGrowthCycle();
        break;

      case "advanced-intel":
        await runAdvancedIntelligence();
        break;

      default:
        console.log("Unknown job:", job.name);
    }
  },
  { connection: redisConnection }
);

console.log("Maya worker running");
