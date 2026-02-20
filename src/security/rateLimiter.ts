import Redis from "ioredis";
import { RedisStore } from "rate-limit-redis";
import rateLimit from "express-rate-limit";

const redis = new Redis(process.env.REDIS_URL || "");

export const redisLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) =>
      redis.call(args[0], ...args.slice(1)) as Promise<any>
  }),
  windowMs: 60 * 1000,
  max: 100
});
