export function validateEnv() {
  const url = process.env.API_URL;

  if (!url) throw new Error('MISSING_API_URL');
  if (!url.includes('/api/v1')) {
    throw new Error('INVALID_API_VERSION');
  }

  if (!process.env.AGENT_API_TOKEN) {
    throw new Error('MISSING_AGENT_API_TOKEN');
  }
}
