import { stopWorker } from "./worker"

export function registerShutdownHooks() {

  const shutdown = async () => {
    console.log("Agent shutdown requested")
    await stopWorker()
    process.exit(0)
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)

}
