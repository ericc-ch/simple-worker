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
