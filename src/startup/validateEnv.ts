const REQUIRED = [
  "OPENAI_API_KEY",
  "BF_SERVER_API",
  "MAYA_SECRET"
]

export function validateEnv() {
  for (const key of REQUIRED) {
    if (!process.env[key]) {
      throw new Error(`Missing environment variable: ${key}`)
    }
  }
}
