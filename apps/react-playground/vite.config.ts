import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rawBasePath = process.env.VITE_BASE_PATH;
const basePath = rawBasePath
  ? rawBasePath.endsWith("/")
    ? rawBasePath
    : `${rawBasePath}/`
  : "/";

export default defineConfig({
  base: basePath,
  plugins: [react()],
  server: {
    port: 4174
  }
});
