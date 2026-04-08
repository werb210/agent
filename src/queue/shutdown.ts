import { stopWorker } from "./worker"

export function registerShutdownHooks() {
  if (process.env.NODE_ENV === "test") {
    return
  }

  let shuttingDown = false
  let shutdownPromise: Promise<void> | null = null

  const shutdown = async () => {
    if (shutdownPromise) {
      return shutdownPromise
    }

    shuttingDown = true
    console.info("Agent shutdown requested")

    shutdownPromise = (async () => {
      try {
        stopWorker()
      } catch {
        // never throw on teardown
      }
    })()

    return shutdownPromise
  }

  const handle = async () => {
    if (shuttingDown) {
      return
    }

    shuttingDown = true
    await shutdown()
    return
  }

  process.on("SIGINT", () => {
    void handle()
  })
  process.on("SIGTERM", () => {
    void handle()
  })
}
