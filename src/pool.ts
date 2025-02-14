/* eslint-disable @typescript-eslint/no-unsafe-return */

import { AnyFunction, WorkerInstance } from "./types"

interface PoolWorker<F extends AnyFunction> {
  instance: WorkerInstance<F>
  busy: boolean
}

interface PoolOptions {
  size?: number
  maxQueueSize?: number
}

interface QueueItem<F extends AnyFunction> {
  params: Parameters<F>
  resolve: (result: ReturnType<F>) => void
  reject: (error: Error) => void
}

export class WorkerPool<F extends AnyFunction> {
  private workers: Array<PoolWorker<F>> = []
  private queue: Array<QueueItem<F>> = []
  private createWorker: () => Promise<WorkerInstance<F>>
  private initialized = false
  private initializePromise: Promise<void> | null = null
  private size: number
  private maxQueueSize: number

  constructor(
    createWorker: () => Promise<WorkerInstance<F>>,
    options: PoolOptions = {},
  ) {
    this.createWorker = createWorker
    this.size = options.size ?? 1
    this.maxQueueSize = options.maxQueueSize ?? Infinity
  }

  private async initialize() {
    for (let i = 0; i < this.size; i++) {
      const instance = await this.createWorker()
      this.workers.push({ instance, busy: false })
    }
  }

  private async ensureInitialized() {
    if (this.initialized) return
    if (!this.initializePromise) {
      this.initializePromise = this.initialize().then(() => {
        this.initialized = true
      })
    }

    await this.initializePromise
  }

  private getAvailableWorker(): PoolWorker<F> | undefined {
    return this.workers.find((w) => !w.busy)
  }

  async execute(...params: Parameters<F>): Promise<ReturnType<F>> {
    await this.ensureInitialized()

    const availableWorker = this.getAvailableWorker()

    if (availableWorker) {
      availableWorker.busy = true
      try {
        const result = await availableWorker.instance.execute(...params)
        availableWorker.busy = false
        await this.processQueue()

        return result
      } catch (error) {
        availableWorker.busy = false
        await this.processQueue()
        throw error
      }
    }

    if (this.queue.length >= this.maxQueueSize) {
      throw new Error("Worker pool queue is full")
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ params, resolve, reject })
    })
  }

  private async processQueue() {
    if (this.queue.length === 0) return

    const availableWorker = this.getAvailableWorker()
    if (!availableWorker) return

    const item = this.queue.shift()
    if (!item) return

    availableWorker.busy = true
    try {
      const result = await availableWorker.instance.execute(...item.params)
      item.resolve(result)
    } catch (error) {
      item.reject(error as Error)
    } finally {
      availableWorker.busy = false
      await this.processQueue()
    }
  }

  terminate() {
    for (const { instance } of this.workers) {
      instance.terminate()
    }
    this.workers = []

    // Reject any remaining queued items
    for (const item of this.queue) {
      item.reject(new Error("Worker pool terminated"))
    }
    this.queue = []
  }

  get queueLength(): number {
    return this.queue.length
  }

  get activeWorkers(): number {
    return this.workers.filter((w) => w.busy).length
  }
}
