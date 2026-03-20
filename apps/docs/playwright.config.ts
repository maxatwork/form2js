import { defineConfig, devices } from "@playwright/test";

const docsE2eHost = process.env.DOCS_E2E_HOST ?? "127.0.0.1";
const docsE2ePort = Number(process.env.DOCS_E2E_PORT ?? "4321");
const docsE2eUrl = `http://${docsE2eHost}:${docsE2ePort}/`;

export default defineConfig({
  testDir: "./test-e2e",
  use: {
    baseURL: docsE2eUrl,
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ],
  webServer: {
    command:
      `PUBLIC_DOCS_E2E_FAULTS=1 npm -w @form2js/docs run build && npm -w @form2js/docs run preview -- --host ${docsE2eHost} --port ${docsE2ePort}`,
    url: docsE2eUrl,
    reuseExistingServer: !process.env.CI
  }
});
