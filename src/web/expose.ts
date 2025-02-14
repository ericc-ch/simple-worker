/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { AnyFunction, WorkerRequest, WorkerResponse } from "../types"

export function expose(fn: AnyFunction): void {
  self.addEventListener(
    "message",
    async (event: MessageEvent<WorkerRequest>) => {
      const msg = event.data
      try {
        const result = await fn(...msg.payload)
        const response: WorkerResponse = {
          id: msg.id,
          data: result,
        }
        self.postMessage(response)
      } catch (error) {
        const response: WorkerResponse = {
          id: msg.id,
          data: error instanceof Error ? error.message : String(error),
        }
        self.postMessage(response)
      }
    },
  )
}
