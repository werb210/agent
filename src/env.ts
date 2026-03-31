import "dotenv/config";
try {
  const { getAgentToken } = require("./config/env");

  getAgentToken();
} catch (err) {
  if (process.env.NODE_ENV === "production") {
    throw err;
  } else {
    const error = err as Error;
    console.warn("Boot fallback active:", error.message);
  }
}
