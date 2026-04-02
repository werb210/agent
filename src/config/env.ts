import { z } from "zod";

export const env = z
  .object({
    API_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]),
  })
  .parse(process.env);
