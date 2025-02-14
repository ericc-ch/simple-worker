import { parentPort } from "node:worker_threads"

import { ensure } from "../lib/ensure"
import { AnyFunction, WorkerRequest, WorkerResponse } from "../types"

export function expose(fn: AnyFunction) {
  ensure(parentPort)

  parentPort.on("message", async (msg: WorkerRequest) => {
    ensure(parentPort)

    const result = await fn(msg.payload)
    const response: WorkerResponse = { id: msg.id, data: result }
    parentPort.postMessage(response)
  })
}
