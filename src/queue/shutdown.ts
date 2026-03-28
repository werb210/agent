import { stopWorker } from "./worker"

export function registerShutdownHooks() {

  const shutdown = () => {
    console.info("Agent shutdown requested")
    stopWorker()
    process.exit(0)
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)

}
