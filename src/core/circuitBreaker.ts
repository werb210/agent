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
        throw new Error("Circuit is OPEN");
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), this.options.timeout)
        )
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
    }
  }
}
