const required = [
  "OPENAI_API_KEY",
  "SERVER_URL",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing env: ${key}`);
  }
}

export const ENV = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  SERVER_URL: process.env.SERVER_URL!,
};
