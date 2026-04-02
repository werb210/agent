import { getEnv } from "./env";

const env = getEnv();

export const API_BASE = `${env.API_URL}/api/v1`;
