import Redis from "ioredis";
import { logger } from "./logger";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl);

export const redisConnection = {
  url: redisUrl
};

redis.on("connect", () => {
  logger.info("Redis connected");
});
