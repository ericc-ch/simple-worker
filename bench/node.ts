import os from "node:os"
import path from "node:path"
import { performance } from "node:perf_hooks"
import { workerTS } from "worker-ts"

import { create } from "../src/node/create"
import { WorkerPool } from "../src/pool"

const TASK_COUNT = 100 // Number of heavy computations to run
const cpuCount = os.availableParallelism()

console.log(`CPU Cores: ${os.availableParallelism()}`)
console.log(`Node.js Version: ${process.version}`)
console.log(`Platform: ${process.platform}`)
console.log("---")

console.log(`Running benchmark with ${TASK_COUNT} heavy computations...`)

async function runBenchmark() {
  // Create a worker for the heavy computation
  const worker = await workerTS(
    path.join(import.meta.dirname, "./fixtures/heavy-compute.ts"),
  )
  const instance = create<(n: number) => number>(worker)

  // Direct function for comparison
  const directCompute = (n: number) => {
    let result = 0
    for (let i = 0; i < 1000000; i++) {
      result += Math.sin(n * i)
    }
    return result
  }

  // Benchmark direct execution (sequential)
  const directStart = performance.now()
  for (let i = 0; i < TASK_COUNT; i++) {
    directCompute(i)
  }
  const directEnd = performance.now()
  const directTime = directEnd - directStart

  // Benchmark single worker execution (sequential)
  const workerStart = performance.now()
  for (let i = 0; i < TASK_COUNT; i++) {
    await instance.execute(i)
  }
  const workerEnd = performance.now()
  const workerTime = workerEnd - workerStart

  // Benchmark worker pool execution (parallel)
  const pool = await WorkerPool.create<(n: number) => number>({
    createWorker: async () => {
      const worker = await workerTS(
        path.join(import.meta.dirname, "./fixtures/heavy-compute.ts"),
      )
      return create(worker)
    },
    size: cpuCount,
  })

  const poolStart = performance.now()
  const poolPromises = Array(TASK_COUNT)
    .fill(0)
    .map((_, i) => pool.execute(i))
  await Promise.all(poolPromises)
  const poolEnd = performance.now()
  const poolTime = poolEnd - poolStart

  // Log results
  console.log(`Direct execution time (sequential): ${directTime.toFixed(2)}ms`)
  console.log(
    `Single worker execution time (sequential): ${workerTime.toFixed(2)}ms`,
  )
  console.log(
    `Single worker vs direct: ${(directTime / workerTime).toFixed(2)}x faster`,
  )

  console.log(
    `Pool execution time (${cpuCount} workers, parallel): ${poolTime.toFixed(2)}ms`,
  )
  console.log(`Pool vs direct: ${(directTime / poolTime).toFixed(2)}x faster`)
  console.log(
    `Pool vs single worker: ${(workerTime / poolTime).toFixed(2)}x faster`,
  )

  // Clean up
  pool.terminate()
  instance.terminate()
}

void runBenchmark().catch(console.error)
