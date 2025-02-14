import { expose } from "../../../src/node/expose"

function add(a: number, b: number) {
  return a + b
}

expose(add)
