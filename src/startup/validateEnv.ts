const REQUIRED = [
  "OPENAI_API_KEY",
  "BF_SERVER_API",
  "MAYA_SECRET"
]

export function validateEnv() {

  const missing = REQUIRED.filter(v => !process.env[v])

  if (missing.length) {

    console.error("Missing environment variables:", missing.join(","))

    process.exit(1)

  }

}
