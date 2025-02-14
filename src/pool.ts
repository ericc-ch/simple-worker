import { AnyFunction, WorkerInstance } from "./types"

interface WorkerPoolOptions<F extends AnyFunction> {
  createWorker: () => Promise<WorkerInstance<F>>
  size?: number
}

export class WorkerPool<F extends AnyFunction> {
  private workers: Array<WorkerInstance<F>> = []
  private createWorker: () => Promise<WorkerInstance<F>>
  private size: number

  constructor({ createWorker, size = 1 }: WorkerPoolOptions<F>) {
    this.createWorker = createWorker
    this.size = size
  }

  async execute(...params: Parameters<F>): Promise<ReturnType<F>> {
    // Create workers lazily on first use
    if (this.workers.length === 0) {
      this.workers = await Promise.all(
        Array(this.size)
          .fill(0)
          .map(() => this.createWorker()),
      )
    }

    // Simple round-robin task distribution
    const workerIndex = Math.floor(Math.random() * this.workers.length)
    return this.workers[workerIndex].execute(...params)
  }

  terminate() {
    this.workers.forEach((worker) => {
      worker.terminate()
    })
    this.workers = []
  }
}
