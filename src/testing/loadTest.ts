import http from "http";
import autocannon from "autocannon";

async function withEphemeralHealthServer<T>(callback: (url: string) => Promise<T>): Promise<T> {
  const server = http.createServer((_req, res) => {
    res.statusCode = 200;
    res.end("ok");
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Failed to resolve ephemeral load-test server address");
  }

  const url = `http://127.0.0.1:${address.port}/health`;

  try {
    return await callback(url);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}

export async function runLoadTest() {
  const targetUrl = process.env.LOAD_TEST_URL;

  if (targetUrl) {
    return autocannon({
      url: targetUrl,
      connections: 50,
      duration: 10
    });
  }

  return withEphemeralHealthServer((url) =>
    autocannon({
      url,
      connections: 50,
      duration: 10
    })
  );
}
