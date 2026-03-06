export interface Job {
  id: string
  type: string
  payload: any
  createdAt: number
}

const queue: Job[] = []

export function enqueue(job: Job) {
  queue.push(job)
}

export function dequeue(): Job | undefined {
  return queue.shift()
}

export function queueLength() {
  return queue.length
}

export function snapshot() {
  return [...queue]
}

export function resetQueue() {
  queue.length = 0
}
