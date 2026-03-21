import { defineConfig } from "astro/config";
import react from "@astrojs/react";

const base = process.env.DOCS_BASE_PATH ?? "/";

export default defineConfig({
  base,
  integrations: [react()],
  vite: {
    server: {
      fs: {
        allow: ["../.."]
      }
    }
  }
});
