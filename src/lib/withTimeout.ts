export async function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timer = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("TIMEOUT")), ms);
  });

  return Promise.race([promise, timer]).finally(() => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });
}
