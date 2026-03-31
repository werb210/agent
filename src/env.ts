import "dotenv/config";
import { enforceAuthReady, setRuntimeToken } from "./lib/token";

const token = process.env.API_TOKEN || process.env.AGENT_API_TOKEN;

if (!token) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("[APP BLOCKED] TOKEN NOT READY");
  }
  console.warn("Boot fallback active: API token missing in non-production environment");
} else {
  setRuntimeToken(token);
  enforceAuthReady();
}
