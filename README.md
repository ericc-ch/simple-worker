# worker-plus

A lightweight and efficient abstraction over Web Workers and Node.js Worker Threads, with built-in worker pool support.

## Installation

```bash
pnpm add worker-plus
```

## Usage

### Basic Worker Usage

#### Worker File (worker.ts)

```typescript
import { expose } from "worker-plus";

function heavyComputation(n: number) {
  let result = 0;
  for (let i = 0; i < n; i++) {
    result += Math.sin(i);
  }
  return result;
}

expose(heavyComputation);
```

#### Main File (main.ts)

```typescript
import { create } from "worker-plus/node";
import { Worker } from "worker_threads"; // or "worker" for web

// For Node.js
const worker = new Worker(new URL("./worker.ts", import.meta.url));
// For Web
// const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })

const instance = create<(n: number) => number>(worker);

async function run() {
  const result = await instance.execute(1000000);
  console.log(result);

  // Clean up when done
  instance.terminate();
}

run();
```

### Worker Pool Usage

When you need to process multiple tasks in parallel:

```typescript
import { WorkerPool } from "simple-worker/node";
import { Worker } from "worker_threads"; // or "worker" for web

async function main() {
  const pool = await WorkerPool.create({
    createWorker: async () => {
      const worker = new Worker(new URL("./worker.ts", import.meta.url));
      return create<(n: number) => number>(worker);
    },
    size: 4, // number of workers in the pool
  });

  // Execute tasks in parallel
  const results = await Promise.all([
    pool.execute(1000000),
    pool.execute(2000000),
    pool.execute(3000000),
    pool.execute(4000000),
  ]);

  console.log(results);

  // Clean up
  pool.terminate();
}

main();
```

## API Reference

### `create(worker)`

Creates a worker instance with type-safe request-response handling.

- `worker`: Worker instance (Web Worker or Node.js Worker Thread)
- Returns: `WorkerInstance<F>` where F is the type of the exposed function

### `expose(fn)`

Exposes a function to handle messages in the worker thread.

- `fn`: The function to expose to the main thread
- Returns: `void`

### `WorkerPool`

Manages a pool of workers for parallel processing.

#### Static Methods

- `create(options)`: Creates a new worker pool
  - `options.createWorker`: Function that returns a new worker instance
  - `options.size`: Number of workers in the pool (default: 1)

#### Instance Methods

- `execute(...params)`: Executes a task on the next available worker
- `terminate()`: Terminates all workers in the pool
