import { stopWorker } from "./worker"

export function registerShutdownHooks() {
  if (process.env.NODE_ENV === "test") {
    return
  }

  let shuttingDown = false

  const shutdown = () => {
    if (shuttingDown) {
      return
    }

    shuttingDown = true
    console.info("Agent shutdown requested")

    try {
      stopWorker()
    } catch (error) {
      console.error("Worker shutdown failure", error)
    }

    process.exit(0)
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
}
