import { AppError } from "../errors/AppError.js";
import { setTimeout as sleep } from "node:timers/promises";
interface CircuitOptions {
  timeout: number;
  failureThreshold: number;
  resetTimeout: number;
}

type CircuitState = "CLOSED" | "OPEN" | "HALF";

const SERVICE_UNAVAILABLE_ERROR = "SERVICE_UNAVAILABLE";

export class CircuitBreaker {
  private failures = 0;
  private state: CircuitState = "CLOSED";
  private lastFailureTime = 0;

  constructor(private options: CircuitOptions) {}

  getState(): CircuitState {
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      const now = Date.now();
      if (now - this.lastFailureTime > this.options.resetTimeout) {
        this.state = "HALF";
      } else {
        throw new Error(SERVICE_UNAVAILABLE_ERROR);
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        sleep(this.options.timeout).then(() => {
          throw new Error("Timeout");
        })
      ]);

      this.failures = 0;
      this.state = "CLOSED";
      return result as T;
    } catch (err) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures > this.options.failureThreshold) {
        this.state = "OPEN";
        throw new Error(SERVICE_UNAVAILABLE_ERROR);
      }

      if (err instanceof AppError) {
        throw err;
      }

      throw err;
    }
  }
}
