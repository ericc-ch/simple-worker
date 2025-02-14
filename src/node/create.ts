import { Worker } from "worker_threads"

import { AnyFunction, WorkerRequest, WorkerResponse } from "../types"

export function create<F extends AnyFunction = AnyFunction>(worker: Worker) {
  const pending = new Map<
    string,
    {
      resolve: (result: ReturnType<F>) => void
      reject: (error: Error) => void
    }
  >()

  // Listen for incoming messages from the worker.
  worker.on("message", (msg: WorkerResponse) => {
    if (typeof msg.id === "string") {
      const handlers = pending.get(msg.id)
      if (!handlers) return

      handlers.resolve(msg.data)
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
    execute: (payload: Parameters<F>[0]): Promise<ReturnType<F>> => {
      const id = globalThis.crypto.randomUUID()

      const { promise, resolve, reject } =
        Promise.withResolvers<ReturnType<F>>()
      pending.set(id, { resolve, reject })

      worker.postMessage({ id, payload } as WorkerRequest)

      return promise
    },
    terminate: () => worker.terminate(),
  }
}
