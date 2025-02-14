import { expose } from "../../src/node/expose"

function heavyCompute(n: number) {
  let result = 0
  // Simulate CPU-intensive work with trigonometric operations
  for (let i = 0; i < 1000000; i++) {
    result += Math.sin(n * i)
  }
  return result
}

expose(heavyCompute)
