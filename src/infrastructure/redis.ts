import { Redis } from "ioredis";
import { logger } from "./logger.js";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redis = new Redis(redisUrl);

export const redisConnection = {
  url: redisUrl
};

redis.on("connect", () => {
  logger.info("Redis connected");
});
