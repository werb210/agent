import { registerShutdownHooks } from "../queue/shutdown"

export function setupShutdown() {
  registerShutdownHooks()
}
