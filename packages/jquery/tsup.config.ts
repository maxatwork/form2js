import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts"
    },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    target: "es2020"
  },
  {
    entry: {
      standalone: "src/standalone.ts"
    },
    format: ["iife"],
    globalName: "form2jsJquery",
    sourcemap: true,
    clean: false,
    target: "es2020",
    external: ["jquery"]
  }
]);
