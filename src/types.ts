/* eslint-disable @typescript-eslint/no-explicit-any */

export type AnyFunction = (...args: Array<any>) => any

export interface WorkerRequest {
  id: string
  payload: any
}

export interface WorkerResponse {
  id: string
  data: any
}

export interface WorkerInstance<F extends AnyFunction> {
  execute: (...args: Parameters<F>) => Promise<ReturnType<F>>
  terminate: () => void
}
