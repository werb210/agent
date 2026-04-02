import { env } from "../config/env";
import { apiFetch } from "../utils/apiClient";

export async function waitForReady(retries = 20, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await apiFetch(`${env.API_URL}/ready`);
      if (res.status === 200) return;
    } catch {}

    await new Promise((r) => setTimeout(r, delay));
  }

  throw new Error("API_NOT_READY");
}
