import path from "node:path"
import { describe, expect, it } from "vitest"
import { workerTS } from "worker-ts"

import { create } from "../../src/node/create"

const testWorkerPath = path.join(
  import.meta.dirname,
  "./fixtures/test-worker.ts",
)

describe("create", () => {
  it("should create a new worker instance and handle communication correctly", async () => {
    const worker = await workerTS(testWorkerPath)
    const instance = create<(a: number, b: number) => number>(worker)

    const result = await instance.execute(5, 3)
    expect(result).toBe(8)

    instance.terminate()
  })

  it("should handle multiple concurrent executions", async () => {
    const worker = await workerTS(testWorkerPath)
    const instance = create<(a: number, b: number) => number>(worker)

    const results = await Promise.all([
      instance.execute(1, 2),
      instance.execute(3, 4),
      instance.execute(5, 6),
    ])

    expect(results).toEqual([3, 7, 11])

    instance.terminate()
  })
})
