import { parentPort } from "node:worker_threads"

import { ensure } from "../lib/ensure"
import { AnyFunction, WorkerRequest } from "../types"

export function expose(fn: AnyFunction) {
  ensure(parentPort)

  parentPort.on("message", async (msg: WorkerRequest) => {
    ensure(parentPort)
    const { id, payload } = msg

    try {
      const result = await fn(payload)
      parentPort.postMessage({ id, status: "success", data: result })
    } catch (error) {
      parentPort.postMessage({
        id,
        status: "error",
        data: (error as Error).message || String(error),
      })
    }
  })
}
