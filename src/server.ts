import type { Server } from "http";
import { createApp } from "./app";
import { validateEnv } from "./startup/validateEnv";

export async function startServer() {
  const envStatus = validateEnv();
  const { app, dependencies } = createApp({ envStatus });

  const server = await new Promise<Server>((resolve) => {
    const listeningServer = app.listen(envStatus.values.port, () => {
      resolve(listeningServer);
    });
  });

  const shutdown = async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    await dependencies.closeAll();
  };

  let shuttingDown = false;
  const handleSignal = (signal: NodeJS.Signals) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    shutdown()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(`Shutdown failure on ${signal}`, error);
        process.exit(1);
      });
  };

  process.on("SIGINT", () => handleSignal("SIGINT"));
  process.on("SIGTERM", () => handleSignal("SIGTERM"));

  return { server, envStatus, dependencies, shutdown };
}
