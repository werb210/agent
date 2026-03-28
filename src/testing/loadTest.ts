const autocannon = require("autocannon") as (
  options: {
    url: string;
    connections: number;
    duration: number;
  },
  callback: (err: Error | null, result: unknown) => void
) => void;

export async function runLoadTest(): Promise<unknown> {
  const targetUrl = process.env.LOAD_TEST_URL ?? "http://127.0.0.1:5000/health";

  return new Promise((resolve, reject) => {
    autocannon(
      {
        url: targetUrl,
        connections: 50,
        duration: 10
      },
      (err: Error | null, result: unknown) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(result);
      }
    );
  });
}
