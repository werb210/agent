import { AppError } from "../errors/AppError";
import { retryFetch } from "./retryFetch";

export async function checkServerHealth() {
  const baseUrl = process.env.BF_SERVER_URL;

  if (!baseUrl) {
    throw new AppError("internal_error", 500, "BF_SERVER_URL is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await retryFetch(`${baseUrl}/health`, { signal: controller.signal });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new AppError("upstream_error", res.status);
    }

    return true;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AppError("upstream_timeout", 504);
    }

    throw err;
  }
}
