export type AnyFunction = (...args: Array<never>) => never | Promise<never>

export interface WorkerRequest {
  id: string
  payload: never
}

export interface WorkerResponse {
  id: string
  data: never
}
