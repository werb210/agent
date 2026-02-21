import { Queue } from "bullmq";
import { redisConnection } from "./redis";

export const mayaQueue = new Queue("maya-jobs", {
  connection: redisConnection
});
