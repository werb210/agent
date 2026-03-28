const required = ["AGENT_API_TOKEN"];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing env var: ${key}`);
  }
});
