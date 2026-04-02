import { getEnv } from "./config/env";

const env = getEnv();

export const API_URL = env.API_URL;
