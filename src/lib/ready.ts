import { apiFetch } from "../utils/apiClient.js";

export async function waitForReady(retries = 20, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      await apiFetch("/ready");
      return;
    } catch {}

    await new Promise((r) => setTimeout(r, delay));
  }

  throw new Error("API_NOT_READY");
}
