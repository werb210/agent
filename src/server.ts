import type { Server } from "http";
import { createApp } from "./app";
import { validateEnv } from "./startup/validateEnv";

export async function startServer() {
  const envStatus = validateEnv();
  const { app, dependencies } = createApp({ envStatus });

  await dependencies.initAll();

  const [db, redis, externalApi, openai, twilio] = await Promise.all([
    dependencies.db.status(),
    dependencies.redis.status(),
    dependencies.externalApi.status(),
    dependencies.openai.status(),
    dependencies.twilio.status(),
  ]);

  console.log(
    JSON.stringify({
      event: "startup_summary",
      envMode: envStatus.mode,
      port: envStatus.values.port,
      dependencies: { db, redis, externalApi, openai, twilio },
    }),
  );

  const server = await new Promise<Server>((resolve) => {
    const listeningServer = app.listen(envStatus.values.port, () => {
      resolve(listeningServer);
    });
  });

  let shuttingDown = false;
  let shutdownPromise: Promise<void> | null = null;

  const closeServer = async () => {
    if (!server.listening) {
      return;
    }

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  };

  const shutdown = async () => {
    if (shutdownPromise) {
      return shutdownPromise;
    }

    shuttingDown = true;

    shutdownPromise = (async () => {
      try {
        await dependencies.closeAll();
      } catch {
        // Teardown errors must not affect shutdown completion.
      }

      await closeServer();
    })();

    return shutdownPromise;
  };

  const handleSignal = async (_signal: NodeJS.Signals) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    await shutdown();
    return;
  };

  if (process.env.NODE_ENV !== "test") {
    process.on("SIGINT", () => {
      void handleSignal("SIGINT");
    });
    process.on("SIGTERM", () => {
      void handleSignal("SIGTERM");
    });
  }

  return { server, envStatus, dependencies, shutdown };
}
