import { registerShutdownHooks } from "../queue/shutdown.js"

export function setupShutdown() {
  registerShutdownHooks()
}
