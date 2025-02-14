import { expose } from "../../src/node/expose"

const add = (a: number, b: number) => a + b

expose(add)
