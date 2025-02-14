import { AnyFunction, WorkerInstance } from "./types"

interface WorkerPoolOptions<F extends AnyFunction> {
  createWorker: () => Promise<WorkerInstance<F>>
  size?: number
}

export class WorkerPool<F extends AnyFunction> {
  private workers: Array<WorkerInstance<F>> = []
  private createWorker: () => Promise<WorkerInstance<F>>
  private size: number
  private currentWorkerIndex = 0

  private constructor({ createWorker, size = 1 }: WorkerPoolOptions<F>) {
    this.createWorker = createWorker
    this.size = size
  }

  static async create<F extends AnyFunction>(
    options: WorkerPoolOptions<F>,
  ): Promise<WorkerPool<F>> {
    const pool = new WorkerPool<F>(options)
    await pool.createWorkers()
    return pool
  }

  private async createWorkers() {
    this.workers = await Promise.all(
      Array(this.size)
        .fill(0)
        .map(() => this.createWorker()),
    )
  }

  async execute(...params: Parameters<F>): Promise<ReturnType<F>> {
    const workerIndex = this.currentWorkerIndex
    this.currentWorkerIndex =
      (this.currentWorkerIndex + 1) % this.workers.length
    return this.workers[workerIndex].execute(...params)
  }

  terminate() {
    this.workers.forEach((worker) => {
      worker.terminate()
    })
    this.workers = []
  }
}
