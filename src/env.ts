const token = process.env.AGENT_API_TOKEN;

if (!token) {
  throw new Error("Missing AGENT_API_TOKEN");
}
