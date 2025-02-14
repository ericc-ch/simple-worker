import { Worker } from "worker_threads"

import { WorkerRequest, WorkerResponse } from "../types"

export function create(worker: Worker) {
  let messageId = 0
  const pending = new Map<
    number,
    {
      resolve: (result: any) => void
      reject: (error: Error) => void
    }
  >()

  // Listen for incoming messages from the worker.
  worker.on("message", (msg: WorkerResponse) => {
    if (msg && typeof msg.id === "number") {
      const handlers = pending.get(msg.id)
      if (!handlers) return
      if (msg.status === "error") {
        handlers.reject(new Error(msg.data))
      } else {
        handlers.resolve(msg.data)
      }
      pending.delete(msg.id)
    }
  })

  // If the worker errors, reject all pending promises.
  worker.on("error", (error: Error) => {
    for (const { reject } of pending.values()) {
      reject(error)
    }
    pending.clear()
  })

  return {
    execute: (payload: any): Promise<any> => {
      return new Promise((resolve, reject) => {
        const id = messageId++
        pending.set(id, { resolve, reject })
        worker.postMessage({ id, payload } as WorkerRequest)
      })
    },
    terminate: () => worker.terminate(),
  }
}
