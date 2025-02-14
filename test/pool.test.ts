import path from "node:path"
import { describe, expect, it } from "vitest"
import { workerTS } from "worker-ts"

import { create } from "../src/node/create"
import { WorkerPool } from "../src/pool"

const testWorkerPath = path.join(
  import.meta.dirname,
  "./node/fixtures/test-worker.ts",
)

describe("WorkerPool", () => {
  it("should execute tasks using worker pool", async () => {
    const pool = await WorkerPool.create<(a: number, b: number) => number>({
      createWorker: async () => {
        const worker = await workerTS(testWorkerPath)
        return create(worker)
      },
      size: 2,
    })

    const result = await pool.execute(5, 3)
    expect(result).toBe(8)

    pool.terminate()
  })
})
