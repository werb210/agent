import { Worker } from "bullmq";
import { redisConnection } from "../infrastructure/redis";
import { runAdvancedIntelligence, runFullMayaCycle } from "./mayaOrchestrator";
import { generateStrategicPlan } from "../services/strategyEngine";
import { autonomousGrowthCycle } from "../services/autonomousGrowth";
import { checkStartupProductLaunch } from "./mayaStartupLaunchEngine";
import { logger } from "../infrastructure/logger";

export function startMayaWorkers() {
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
        case "startup-check":
          await checkStartupProductLaunch();
          break;
        default:
          logger.info("Unknown job", { name: job.name });
      }
    },
    { connection: redisConnection }
  );

  logger.info("Maya worker running");
}
