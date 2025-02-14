import { describe, it, expect } from "vitest"
import { create } from "../../src/web/create"

class TestWorker implements Worker {
  // Basic Worker interface implementation
  addEventListener(type: "message" | "error", listener: EventListener): void {
    if (type === "message") {
      this.messageListeners.push(listener)
    } else if (type === "error") {
      this.errorListeners.push(listener)
    }
  }

  removeEventListener(type: "message" | "error", listener: EventListener): void {
    if (type === "message") {
      const index = this.messageListeners.indexOf(listener)
      if (index !== -1) this.messageListeners.splice(index, 1)
    } else if (type === "error") {
      const index = this.errorListeners.indexOf(listener)
      if (index !== -1) this.errorListeners.splice(index, 1)
    }
  }

  postMessage(message: any): void {
    // Simulate worker response with addition operation
    setTimeout(() => {
      const response = {
        id: message.id,
        data: message.payload[0] + message.payload[1],
      }
      this.messageListeners.forEach(listener => {
        listener(new MessageEvent("message", { data: response }))
      })
    }, 0)
  }

  terminate(): void {
    this.messageListeners = []
    this.errorListeners = []
  }

  // Internal implementation details
  private messageListeners: EventListener[] = []
  private errorListeners: EventListener[] = []

  triggerError(message: string): void {
    const error = new ErrorEvent("error", { 
      message,
      error: new Error(message)
    })
    this.errorListeners.forEach(listener => listener(error))
  }
}

describe("web/create", () => {
  let worker: TestWorker

  beforeEach(() => {
    worker = new TestWorker()
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

  it("should handle worker errors", async () => {
    const instance = create<(a: number, b: number) => number>(worker)
    const executePromise = instance.execute(2, 3)
    worker.triggerError("Test error")
    await expect(executePromise).rejects.toThrow("Test error")
  })
})
