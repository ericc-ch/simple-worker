/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  AnyFunction,
  WorkerRequest,
  WorkerResponse,
  WorkerInstance,
} from "../types"

export function create<F extends AnyFunction = AnyFunction>(
  worker: Worker,
): WorkerInstance<F> {
  const pending = new Map<
    string,
    {
      resolve: (result: ReturnType<F>) => void
      reject: (error: Error) => void
    }
  >()

  // Listen for incoming messages from the worker
  worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
    const msg = event.data
    if (typeof msg.id === "string") {
      const handlers = pending.get(msg.id)
      if (!handlers) return

      handlers.resolve(msg.data)
      pending.delete(msg.id)
    }
  })

  // Handle worker errors
  worker.addEventListener("error", (error: ErrorEvent) => {
    for (const { reject } of pending.values()) {
      reject(new Error(error.message))
    }
    pending.clear()
  })

  return {
    execute: async (...params: Parameters<F>): Promise<ReturnType<F>> => {
      const id = globalThis.crypto.randomUUID()

      const { promise, resolve, reject } =
        Promise.withResolvers<ReturnType<F>>()

      const request: WorkerRequest = { id, payload: params }
      worker.postMessage(request)
      pending.set(id, { resolve, reject })

      return promise
    },
    terminate: () => {
      worker.terminate()
      // Clean up any pending promises
      for (const { reject } of pending.values()) {
        reject(new Error("Worker terminated"))
      }
      pending.clear()
    },
  }
}
