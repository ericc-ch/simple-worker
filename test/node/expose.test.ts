import { parentPort } from "node:worker_threads"
import { describe, expect, it, vi } from "vitest"

import { expose } from "../../src/node/expose"
import { WorkerRequest } from "../../src/types"

// Mock the worker thread's parentPort
vi.mock("node:worker_threads", () => ({
  parentPort: {
    on: vi.fn(),
    postMessage: vi.fn(),
  },
}))

describe("expose", () => {
  it("should register a message handler on parentPort", () => {
    const testFn = vi.fn()
    expose(testFn)

    expect(parentPort?.on).toHaveBeenCalledWith("message", expect.any(Function))
  })

  it("should call the provided function with the payload and post back a valid response", async () => {
    const testFn = vi.fn().mockResolvedValue(42)
    expose(testFn)

    // Get the message handler that was registered
    const messageHandler = vi.mocked(parentPort?.on).mock.calls[0][1]

    const testRequest: WorkerRequest = {
      id: "test-id",
      payload: [1, 2, 3],
    }

    // Manually trigger the message handler
    await messageHandler(testRequest)

    // Verify the function was called with spread payload
    expect(testFn).toHaveBeenCalledWith(1, 2, 3)

    // Verify the response was posted back
    expect(parentPort?.postMessage).toHaveBeenCalledWith({
      id: "test-id",
      data: 42,
    })
  })

  it("should handle errors from the provided function", async () => {
    const error = new Error("Test error")
    const testFn = vi.fn().mockRejectedValue(error)
    expose(testFn)

    const messageHandler = vi.mocked(parentPort?.on).mock.calls[0][1]

    const testRequest: WorkerRequest = {
      id: "test-id",
      payload: [1, 2, 3],
    }

    await expect(messageHandler(testRequest)).rejects.toThrow("Test error")
  })
})
