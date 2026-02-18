import { defineConfig } from "vite";

const rawBasePath = process.env.VITE_BASE_PATH;
const basePath = rawBasePath
  ? rawBasePath.endsWith("/")
    ? rawBasePath
    : `${rawBasePath}/`
  : "/";

export default defineConfig({
  base: basePath,
  server: {
    port: 4173
  }
});
