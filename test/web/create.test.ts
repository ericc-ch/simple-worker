import { describe, it, expect, beforeEach, afterEach } from "vitest"

import { create } from "../../src/web/create"

describe("web/create", () => {
  let worker: Worker

  beforeEach(() => {
    worker = new Worker(new URL("./fixtures/test-worker.ts", import.meta.url), {
      type: "module",
    })
  })

  afterEach(() => {
    worker.terminate()
  })

  it("should execute function and return result", async () => {
    const instance = create<(a: number, b: number) => number>(worker)
    const result = await instance.execute(2, 3)
    expect(result).toBe(5)
  })

  it("should handle multiple concurrent executions", async () => {
    const instance = create<(a: number, b: number) => number>(worker)
    const results = await Promise.all([
      instance.execute(1, 2),
      instance.execute(3, 4),
      instance.execute(5, 6),
    ])
    expect(results).toEqual([3, 7, 11])
  })

  it("should handle worker termination", async () => {
    const instance = create<(a: number, b: number) => number>(worker)
    const executePromise = instance.execute(2, 3)
    instance.terminate()
    await expect(executePromise).rejects.toThrow("Worker terminated")
  })
})
