import { Worker } from "bullmq";
import { redisConnection } from "../infrastructure/redis.js";
import { runAdvancedIntelligence, runFullMayaCycle } from "./mayaOrchestrator.js";
import { generateStrategicPlan } from "../services/strategyEngine.js";
import { autonomousGrowthCycle } from "../services/autonomousGrowth.js";
import { checkStartupProductLaunch } from "./mayaStartupLaunchEngine.js";
import { logger } from "../infrastructure/logger.js";

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
        case "transcribeCall":
        case "summarizeCall":
        case "scoreCall":
          logger.info(`${job.name} queued`, {
            callSid: job.data?.callSid,
            sessionId: job.data?.sessionId,
            requestId: job.id
          });
          break;
        default:
          logger.info("Unknown job", { name: job.name });
      }
    },
    { connection: redisConnection }
  );

  logger.info("Maya worker running");
}
