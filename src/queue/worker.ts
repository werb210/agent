import { dequeue } from "./jobQueue"

const MAX_ATTEMPTS = 3
let running = true

export async function startWorker(handler: (job: any) => Promise<void>) {

  running = true

  while (running) {

    const job = dequeue()

    if (!job) {
      await new Promise(r => setTimeout(r, 500))
      continue
    }

    let attempts = 0

    while (attempts < MAX_ATTEMPTS) {

      try {

        await handler(job)

        break

      } catch (err) {

        attempts++

        if (attempts >= MAX_ATTEMPTS) {
          console.error("JOB FAILED", job.id)
        }

      }

    }

  }

}

export function stopWorker() {
  running = false
}
