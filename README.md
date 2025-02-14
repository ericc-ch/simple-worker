# simple-worker

A simple abstraction over node worker.

## Installation

Install the package via pnpm:

```bash
pnpm add simple-worker
```

## Usage

Here's an example of how to create a worker and use it in your code:

```typescript
import { create } from "simple-worker";
import { Worker } from "worker_threads";

const worker = new Worker(new URL("./path/to/your/worker.js", import.meta.url));
const workerInstance = create(worker);

async function run() {
  const result = await workerInstance.execute("your payload");
  console.log(result);
}

run();
```

## API

The package exports two main functions:
- `create(worker)`: Initializes a worker instance with request-response handling.
- `expose(fn)`: Exposes a function to handle messages from a worker thread.

For more details, see the module documentation.

