import { Queue } from "bullmq";
import { redisConnection } from "./redis.js";

export const mayaQueue = new Queue("maya-jobs", {
  connection: redisConnection
});
