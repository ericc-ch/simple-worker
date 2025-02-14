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
    const pool = new WorkerPool<(a: number, b: number) => number>(
      async () => {
        const worker = await workerTS(testWorkerPath)
        return create(worker)
      },
      { size: 2 },
    )

    const result = await pool.execute(5, 3)
    expect(result).toBe(8)

    pool.terminate()
  })

  it("should handle multiple concurrent executions", async () => {
    const pool = new WorkerPool<(a: number, b: number) => number>(
      async () => {
        const worker = await workerTS(testWorkerPath)
        return create(worker)
      },
      { size: 2 },
    )

    const results = await Promise.all([
      pool.execute(1, 2),
      pool.execute(3, 4),
      pool.execute(5, 6),
      pool.execute(7, 8),
    ])

    expect(results).toEqual([3, 7, 11, 15])
    expect(pool.activeWorkers).toBe(0) // All workers should be free now
    expect(pool.queueLength).toBe(0) // Queue should be empty

    pool.terminate()
  })
})
