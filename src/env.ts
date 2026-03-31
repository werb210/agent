export const openaiEnabled = !!process.env.OPENAI_API_KEY;

if (!openaiEnabled) {
  console.warn("OpenAI not configured - AI disabled");
}

if (!process.env.SERVER_URL) {
  console.warn("SERVER_URL not configured - using local default");
}

export const ENV = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  SERVER_URL: process.env.SERVER_URL ?? "http://127.0.0.1:4000",
};
