import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl);

export const redisConnection = {
  url: redisUrl
};

redis.on("connect", () => {
  console.log("Redis connected");
});
