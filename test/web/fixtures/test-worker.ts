import { expose } from "../../../src/web/expose"

function add(a: number, b: number) {
  return a + b
}

expose(add)
