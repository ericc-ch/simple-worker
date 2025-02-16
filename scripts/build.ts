import { build } from "tsup"

await build({
  entry: ["src/node/main.ts"],
  outDir: "dist/node",

  format: ["esm"],
  target: "esnext",
  platform: "node",

  dts: true,
  sourcemap: true,
  shims: true,
  clean: true,
})

await build({
  entry: ["src/web/main.ts"],
  outDir: "dist/web",

  format: ["esm"],
  target: "esnext",
  platform: "browser",

  dts: true,
  sourcemap: true,
  shims: true,
  clean: true,
})
