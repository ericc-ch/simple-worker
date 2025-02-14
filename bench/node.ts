import os from "node:os"
import path from "node:path"
import { performance } from "node:perf_hooks"
import { workerTS } from "worker-ts"

import { create } from "../src/node/create"

const ITERATIONS = 100000

console.log(`CPU Cores: ${os.availableParallelism()}`)
console.log(`Node.js Version: ${process.version}`)
console.log(`Platform: ${process.platform}`)
console.log("---")

// Actual benchmark
console.log(`Running benchmark with ${ITERATIONS} iterations...`)

async function runBenchmark() {
  // Create a worker for the add function
  const worker = await workerTS(
    path.join(import.meta.dirname, "./fixtures/add-node.ts"),
  )
  const instance = create<(a: number, b: number) => number>(worker)

  // Direct function for comparison
  const directAdd = (a: number, b: number) => a + b

  // Benchmark direct execution
  const directStart = performance.now()
  for (let i = 0; i < ITERATIONS; i++) {
    directAdd(i, i)
  }
  const directEnd = performance.now()
  const directTime = directEnd - directStart

  // Benchmark worker execution
  const workerStart = performance.now()
  for (let i = 0; i < ITERATIONS; i++) {
    await instance.execute(i, i)
  }
  const workerEnd = performance.now()
  const workerTime = workerEnd - workerStart

  // Benchmark split execution (half main thread, half worker)
  const splitStart = performance.now()
  const halfIterations = Math.floor(ITERATIONS / 2)

  // Main thread work
  for (let i = 0; i < halfIterations; i++) {
    directAdd(i, i)
  }

  // Worker thread work (concurrent)
  const workerPromises = []
  for (let i = halfIterations; i < ITERATIONS; i++) {
    workerPromises.push(instance.execute(i, i))
  }
  await Promise.all(workerPromises)

  const splitEnd = performance.now()
  const splitTime = splitEnd - splitStart

  console.log(`Direct execution time: ${directTime.toFixed(2)}ms`)
  console.log(`Worker execution time: ${workerTime.toFixed(2)}ms`)
  console.log(`Split execution time: ${splitTime.toFixed(2)}ms`)
  console.log(
    `Worker overhead: ${(workerTime / directTime).toFixed(2)}x slower`,
  )
  console.log(`Split overhead: ${(splitTime / directTime).toFixed(2)}x slower`)
}

void runBenchmark().catch(console.error)
