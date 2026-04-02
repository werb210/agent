let cachedEnv: {
  OPENAI_API_KEY?: string;
  API_URL?: string;
  NODE_ENV?: string;
} | null = null;

export function getEnv() {
  if (cachedEnv) return cachedEnv;

  cachedEnv = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    API_URL: process.env.API_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  return cachedEnv;
}
