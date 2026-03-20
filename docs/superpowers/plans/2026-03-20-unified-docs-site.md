# Unified Docs Site Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the split examples/playground setup with one Astro-based docs site that combines overview content, a multi-package playground, and API docs rendered from `docs/api.md`.

**Architecture:** Create `apps/docs` as the single public site, with Astro pages for the static shell and docs routes, and a client-side React playground island for the interactive package switcher. Render API reference content through a dedicated markdown pipeline from `docs/api.md`, and migrate existing examples/playground logic into isolated variant modules with shared shell-owned output panels.

**Tech Stack:** Astro, React, TypeScript, Vite, existing workspace packages, Vitest, browser E2E smoke tests, GitHub Pages Actions

---

## File Structure

Planned file responsibilities before task decomposition:

- `apps/docs/package.json`
  docs app dependencies and scripts
- `apps/docs/astro.config.mjs`
  Astro config, React integration, repo `docs/` access, site base handling
- `apps/docs/tsconfig.json`
  docs app TypeScript config
- `apps/docs/src/pages/index.astro`
  homepage route with hero, package overview, and playground mount
- `apps/docs/src/pages/api/index.astro`
  API docs route
- `apps/docs/src/layouts/DocsShell.astro`
  shared site layout and top-level nav
- `apps/docs/src/layouts/ApiDocsLayout.astro`
  API page layout composed inside `DocsShell`
- `apps/docs/src/lib/site-routes.ts`
  canonical base-path-aware route helpers
- `apps/docs/src/lib/api-docs-source.ts`
  `docs/api.md` loader, parsing, slugging, heading extraction, intro extraction, link rewriting
- `apps/docs/src/components/api/ApiToc.tsx`
  TOC tree and active-section behavior
- `apps/docs/src/components/playground/PlaygroundShell.tsx`
  active variant state, query-param sync, output-state storage, failed-state handling
- `apps/docs/src/components/playground/VariantHeader.tsx`
  shared per-variant header chrome
- `apps/docs/src/components/playground/ReactInspectorPanel.tsx`
  shared output/status UI for React variant
- `apps/docs/src/components/playground/StandardResultPanel.tsx`
  shared output/status UI for non-React variants
- `apps/docs/src/components/playground/variant-registry.ts`
  single source for variant metadata and seeded output factories
- `apps/docs/src/components/playground/types.ts`
  `VariantDefinition`, `VariantComponentProps`, `OutputState`, `ErrorInfo`
- `apps/docs/src/components/playground/variants/react-variant.tsx`
  React demo migrated from `apps/react-playground`
- `apps/docs/src/components/playground/variants/form-variant.tsx`
  DOM parser / legacy `form2js()` variant
- `apps/docs/src/components/playground/variants/jquery-variant.tsx`
  jQuery plugin variant plus client-only bootstrap
- `apps/docs/src/components/playground/variants/js2form-variant.tsx`
  object-to-form variant
- `apps/docs/src/components/playground/variants/core-variant.tsx`
  raw parser JSON-entry variant
- `apps/docs/src/components/playground/variants/form-data-variant.tsx`
  tuple-entry variant
- `apps/docs/src/components/playground/bootstrap/jquery-bootstrap.ts`
  client-only, idempotent jQuery plugin setup
- `apps/docs/src/styles/global.css`
  shared docs site styles derived from `apps/examples`
- `apps/docs/test/*.spec.ts`
  unit-level docs component and source-pipeline tests
- `apps/docs/test-e2e/*.spec.ts`
  browser E2E smoke tests
- `apps/docs/playwright.config.ts`
  browser E2E runner configuration
- `package.json`
  root docs scripts and updated test wiring
- `turbo.json`
  docs build/test/typecheck participation
- `.github/workflows/pages.yml`
  docs-site Pages deployment
- `README.md`
  public docs URL / local dev instructions
- `apps/examples/**`
  removed in cleanup chunk
- `apps/react-playground/**`
  removed in cleanup chunk

## Chunk 1: Docs App Foundation

### Task 1: Scaffold `apps/docs`

**Files:**
- Create: `apps/docs/package.json`
- Create: `apps/docs/astro.config.mjs`
- Create: `apps/docs/tsconfig.json`
- Create: `apps/docs/src/pages/index.astro`
- Create: `apps/docs/src/layouts/DocsShell.astro`
- Create: `apps/docs/src/styles/global.css`
- Modify: `package.json`
- Modify: `turbo.json`

- [ ] **Step 1: Write failing docs-app smoke test placeholders**
  Create a minimal docs app test file under `apps/docs/test/` that expects the homepage shell to render a hero heading.

- [ ] **Step 2: Run the docs test to verify it fails**
  Run: `npm -w @form2js/docs run test`
  Expected: fail because the docs workspace does not exist yet.

- [ ] **Step 3: Add the docs workspace package and Astro config**
  Define scripts for `dev`, `build`, `preview`, `test`, `typecheck`, and `lint`. Configure React integration and base-path-aware routing.

- [ ] **Step 4: Create the shared docs shell and homepage stub**
  Render the top nav, hero shell, and global stylesheet hookup in `index.astro` and `DocsShell.astro`.

- [ ] **Step 5: Update root scripts and Turbo participation**
  Add root scripts like `docs`, `docs:build`, and ensure docs workspace joins root `build`, `typecheck`, and `test`.

- [ ] **Step 6: Run docs checks**
  Run:
  - `npm -w @form2js/docs run test`
  - `npm -w @form2js/docs run build`
  - `npm -w @form2js/docs run typecheck`
  Expected: pass.

- [ ] **Step 7: Commit**
  Run:
  ```bash
  git add apps/docs package.json turbo.json
  git commit -m "feat: scaffold unified docs app"
  ```

### Task 2: Add canonical route helpers and base-path handling

**Files:**
- Create: `apps/docs/src/lib/site-routes.ts`
- Modify: `apps/docs/src/pages/index.astro`
- Modify: `apps/docs/src/layouts/DocsShell.astro`
- Test: `apps/docs/test/site-routes.test.ts`

- [ ] **Step 1: Write failing route-helper tests**
  Cover homepage route, API route trailing slash behavior, and query-param preservation under base paths.

- [ ] **Step 2: Run targeted test**
  Run: `npm -w @form2js/docs run test -- site-routes`
  Expected: fail because helper file does not exist.

- [ ] **Step 3: Implement `site-routes.ts`**
  Export canonical route helpers for homepage, API docs route, and homepage variant URLs.

- [ ] **Step 4: Use route helpers in the shell/homepage**
  Replace literal route strings with the helper functions.

- [ ] **Step 5: Re-run targeted and full docs tests**
  Run:
  - `npm -w @form2js/docs run test -- site-routes`
  - `npm -w @form2js/docs run test`
  Expected: pass.

- [ ] **Step 6: Commit**
  ```bash
  git add apps/docs/src/lib/site-routes.ts apps/docs/src/pages/index.astro apps/docs/src/layouts/DocsShell.astro apps/docs/test/site-routes.test.ts
  git commit -m "feat: add docs route helpers"
  ```

## Chunk 2: Playground Shell and Shared Contracts

### Task 3: Define playground types and registry

**Files:**
- Create: `apps/docs/src/components/playground/types.ts`
- Create: `apps/docs/src/components/playground/variant-registry.ts`
- Test: `apps/docs/test/variant-registry.test.ts`

- [ ] **Step 1: Write failing registry/contract tests**
  Cover six variants, unique IDs, `kind`, `createInitialOutputState`, labels, summaries, and package names.

- [ ] **Step 2: Run targeted tests**
  Run: `npm -w @form2js/docs run test -- variant-registry`
  Expected: fail due to missing files.

- [ ] **Step 3: Implement `OutputState`, `ErrorInfo`, `VariantComponentProps`, and `VariantDefinition`**
  Keep `OutputState` serializable and aligned with the spec.

- [ ] **Step 4: Implement the registry**
  Add the six variant definitions with seeded idle-state factories and metadata used by both homepage overview and playground header.

- [ ] **Step 5: Re-run registry tests**
  Run: `npm -w @form2js/docs run test -- variant-registry`
  Expected: pass.

- [ ] **Step 6: Commit**
  ```bash
  git add apps/docs/src/components/playground/types.ts apps/docs/src/components/playground/variant-registry.ts apps/docs/test/variant-registry.test.ts
  git commit -m "feat: add playground variant registry"
  ```

### Task 4: Implement shared playground shell and output panels

**Files:**
- Create: `apps/docs/src/components/playground/PlaygroundShell.tsx`
- Create: `apps/docs/src/components/playground/VariantHeader.tsx`
- Create: `apps/docs/src/components/playground/ReactInspectorPanel.tsx`
- Create: `apps/docs/src/components/playground/StandardResultPanel.tsx`
- Modify: `apps/docs/src/pages/index.astro`
- Test: `apps/docs/test/playground-shell.test.tsx`

- [ ] **Step 1: Write failing shell tests**
  Cover active variant rendering, query-param sync, output-panel selection by `kind`, failed-state fallback rendering, and preserved output-state storage.

- [ ] **Step 2: Run targeted tests**
  Run: `npm -w @form2js/docs run test -- playground-shell`
  Expected: fail due to missing shell/components.

- [ ] **Step 3: Implement shared header and output panels**
  `VariantHeader` renders registry metadata; output panels render all output/error UI from `OutputState`.

- [ ] **Step 4: Implement `PlaygroundShell`**
  Handle active variant switching, lazy mounting, `isActive`, query-param updates, state storage, and failed-state fallback.

- [ ] **Step 5: Mount the playground on the homepage**
  Replace homepage stub with the shell component.

- [ ] **Step 6: Re-run targeted and full docs tests**
  Run:
  - `npm -w @form2js/docs run test -- playground-shell`
  - `npm -w @form2js/docs run test`
  Expected: pass.

- [ ] **Step 7: Commit**
  ```bash
  git add apps/docs/src/components/playground apps/docs/src/pages/index.astro apps/docs/test/playground-shell.test.tsx
  git commit -m "feat: add unified playground shell"
  ```

## Chunk 3: Standard Variant Migration

### Task 5: Port `form`, `jquery`, and `js2form` variants

**Files:**
- Create: `apps/docs/src/components/playground/variants/form-variant.tsx`
- Create: `apps/docs/src/components/playground/variants/jquery-variant.tsx`
- Create: `apps/docs/src/components/playground/variants/js2form-variant.tsx`
- Create: `apps/docs/src/components/playground/bootstrap/jquery-bootstrap.ts`
- Test: `apps/docs/test/standard-variants.test.tsx`

- [ ] **Step 1: Write failing tests for the three browser-form variants**
  Cover seeded controls, run/reset actions, expected `OutputState` transitions, and jQuery bootstrap idempotence.

- [ ] **Step 2: Run targeted tests**
  Run: `npm -w @form2js/docs run test -- standard-variants`
  Expected: fail due to missing variant files.

- [ ] **Step 3: Port the `form` variant**
  Reuse the current DOM/legacy example flows and emit only `OutputState` to the shell.

- [ ] **Step 4: Port the `jquery` variant with client-only bootstrap**
  Keep plugin installation out of module top level; bootstrap after mount only.

- [ ] **Step 5: Port the `js2form` variant**
  Keep JSON input, apply/reset actions, and emit idle/success/error states through `StandardResultPanel`.

- [ ] **Step 6: Re-run targeted tests**
  Run: `npm -w @form2js/docs run test -- standard-variants`
  Expected: pass.

- [ ] **Step 7: Commit**
  ```bash
  git add apps/docs/src/components/playground/variants apps/docs/src/components/playground/bootstrap apps/docs/test/standard-variants.test.tsx
  git commit -m "feat: port browser form playground variants"
  ```

### Task 6: Port `core` and `form-data` variants

**Files:**
- Create: `apps/docs/src/components/playground/variants/core-variant.tsx`
- Create: `apps/docs/src/components/playground/variants/form-data-variant.tsx`
- Test: `apps/docs/test/data-variants.test.tsx`

- [ ] **Step 1: Write failing tests for parser-only variants**
  Cover seeded JSON entries, success output, invalid JSON error output, and preserved state when switching away and back.

- [ ] **Step 2: Run targeted tests**
  Run: `npm -w @form2js/docs run test -- data-variants`
  Expected: fail.

- [ ] **Step 3: Implement the `core` variant**
  Use JSON entry objects and emit standard output states.

- [ ] **Step 4: Implement the `form-data` variant**
  Use tuple entries and emit standard output states.

- [ ] **Step 5: Re-run targeted and full docs tests**
  Run:
  - `npm -w @form2js/docs run test -- data-variants`
  - `npm -w @form2js/docs run test`
  Expected: pass.

- [ ] **Step 6: Commit**
  ```bash
  git add apps/docs/src/components/playground/variants/core-variant.tsx apps/docs/src/components/playground/variants/form-data-variant.tsx apps/docs/test/data-variants.test.tsx
  git commit -m "feat: port parser playground variants"
  ```

## Chunk 4: React Variant and API Docs Pipeline

### Task 7: Port the React variant

**Files:**
- Create: `apps/docs/src/components/playground/variants/react-variant.tsx`
- Test: `apps/docs/test/react-variant.test.tsx`

- [ ] **Step 1: Write failing React variant tests**
  Cover seeded valid state, validation failure, callback failure toggle, reset-state behavior, and React-category `OutputState`.

- [ ] **Step 2: Run targeted tests**
  Run: `npm -w @form2js/docs run test -- react-variant`
  Expected: fail.

- [ ] **Step 3: Port the React playground logic**
  Preserve submit state, validation, callback failure, and reset-to-idle semantics while emitting shell-owned output state.

- [ ] **Step 4: Re-run targeted and full docs tests**
  Run:
  - `npm -w @form2js/docs run test -- react-variant`
  - `npm -w @form2js/docs run test`
  Expected: pass.

- [ ] **Step 5: Commit**
  ```bash
  git add apps/docs/src/components/playground/variants/react-variant.tsx apps/docs/test/react-variant.test.tsx
  git commit -m "feat: port react playground variant"
  ```

### Task 8: Implement API docs source pipeline and route

**Files:**
- Create: `apps/docs/src/lib/api-docs-source.ts`
- Create: `apps/docs/src/components/api/ApiToc.tsx`
- Create: `apps/docs/src/layouts/ApiDocsLayout.astro`
- Create: `apps/docs/src/pages/api/index.astro`
- Test: `apps/docs/test/api-docs-source.test.ts`
- Test: `apps/docs/test/api-docs-page.test.tsx`

- [ ] **Step 1: Write failing API pipeline tests**
  Cover H1 extraction, empty intro behavior, H2/H3 heading extraction, duplicate slug deduplication, link rewriting, and missing-H1 build-failure behavior.

- [ ] **Step 2: Run targeted tests**
  Run: `npm -w @form2js/docs run test -- api-docs`
  Expected: fail because source/page files are missing.

- [ ] **Step 3: Implement `ApiDocsSource`**
  Load `docs/api.md`, extract H1/intro/body/headings, rewrite links, and expose deterministic deduplicated slugs.

- [ ] **Step 4: Implement `ApiDocsLayout` and `ApiToc`**
  Compose `DocsShell`, render the API chrome, and support active-section behavior.

- [ ] **Step 5: Implement the `/api/` route**
  Render API page title/intro from the extracted H1/intro and body from the first H2 onward.

- [ ] **Step 6: Re-run targeted and full docs tests**
  Run:
  - `npm -w @form2js/docs run test -- api-docs`
  - `npm -w @form2js/docs run build`
  Expected: pass.

- [ ] **Step 7: Commit**
  ```bash
  git add apps/docs/src/lib/api-docs-source.ts apps/docs/src/components/api/ApiToc.tsx apps/docs/src/layouts/ApiDocsLayout.astro apps/docs/src/pages/api/index.astro apps/docs/test/api-docs-source.test.ts apps/docs/test/api-docs-page.test.tsx
  git commit -m "feat: add api docs markdown pipeline"
  ```

## Chunk 5: Browser E2E, Deployment, and Cleanup

### Task 9: Add browser E2E smoke coverage

**Files:**
- Create: `apps/docs/playwright.config.ts`
- Create: `apps/docs/test-e2e/homepage.spec.ts`
- Create: `apps/docs/test-e2e/api-docs.spec.ts`
- Modify: `apps/docs/package.json`
- Modify: `package.json`

- [ ] **Step 1: Write failing browser smoke specs**
  Cover base-path-aware routing, variant switcher keyboard interaction, preserved state, failed-variant isolation through a test-only fault injection seam, API TOC behavior, anchor links, and mobile “On this page”.

- [ ] **Step 2: Run docs browser tests to verify failure**
  Run: `npm -w @form2js/docs run test:e2e`
  Expected: fail because the runner/config/specs do not exist yet.

- [ ] **Step 3: Add browser E2E runner config**
  Run tests against a built-and-previewed docs app rather than only a dev server.

- [ ] **Step 4: Add a deterministic fault-injection seam**
  Provide a test-only path for triggering render/bootstrap/event failures without changing production behavior.

- [ ] **Step 5: Wire docs tests into root test flow**
  Ensure root `npm run test` runs package tests, integration tests, and docs workspace/browser smoke tests.

- [ ] **Step 6: Re-run docs/browser/root tests**
  Run:
  - `npm -w @form2js/docs run test:e2e`
  - `npm run test`
  Expected: pass.

- [ ] **Step 7: Commit**
  ```bash
  git add apps/docs/playwright.config.ts apps/docs/test-e2e apps/docs/package.json package.json
  git commit -m "test: add docs browser smoke coverage"
  ```

### Task 10: Switch Pages deployment and update public docs pointers

**Files:**
- Modify: `.github/workflows/pages.yml`
- Modify: `README.md`

- [ ] **Step 1: Write failing workflow/docs checks**
  Add assertions or smoke coverage that the built output path and local instructions match the docs app.

- [ ] **Step 2: Update Pages workflow**
  Build workspace packages, then build and upload the docs app output using the Pages base path.

- [ ] **Step 3: Update README**
  Replace playground-only deployment wording with unified docs site wording and new local commands.

- [ ] **Step 4: Run workflow-relevant local verification**
  Run:
  - `npm run build`
  - `npm -w @form2js/docs run test`
  Expected: pass.

- [ ] **Step 5: Commit**
  ```bash
  git add .github/workflows/pages.yml README.md
  git commit -m "chore: deploy unified docs site"
  ```

### Task 11: Remove legacy apps after verification

**Files:**
- Delete: `apps/examples/**`
- Delete: `apps/react-playground/**`
- Modify: `package.json`

- [ ] **Step 1: Verify no remaining runtime references**
  Search for old app package names and scripts before deleting.

- [ ] **Step 2: Remove legacy app directories and scripts**
  Delete old app files and remove obsolete root scripts.

- [ ] **Step 3: Run final checks**
  Run:
  - `npm run build`
  - `npm run test`
  - `npm run typecheck`
  Expected: pass.

- [ ] **Step 4: Commit**
  ```bash
  git add -A
  git commit -m "chore: remove legacy playground apps"
  ```

