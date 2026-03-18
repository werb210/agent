import { AppError } from "../errors/AppError";
interface CircuitOptions {
  timeout: number;
  failureThreshold: number;
  resetTimeout: number;
}

type CircuitState = "CLOSED" | "OPEN" | "HALF";

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
        throw new AppError("internal_error", 500, "Circuit is OPEN");
      }
    }

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => {
          timeoutHandle = setTimeout(() => reject(new Error("Timeout")), this.options.timeout);
          if (typeof timeoutHandle.unref === "function") {
            timeoutHandle.unref();
          }
        })
      ]);

      this.failures = 0;
      this.state = "CLOSED";
      return result as T;
    } catch (err) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.options.failureThreshold) {
        this.state = "OPEN";
      }

      throw err;
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}
