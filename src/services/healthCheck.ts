import { AppError } from "../errors/AppError";
import { bfServerRequest } from "../integrations/bfServerClient";

export async function checkServerHealth() {
  try {
    await bfServerRequest("/health", "GET");
    return true;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AppError("upstream_timeout", 504);
    }

    throw err;
  }
}
