# Unified Docs Site Design

Date: 2026-03-20
Project: `form2js`
Status: Approved for planning review

## Goal

Replace the split `apps/examples` and `apps/react-playground` sites with one static documentation site that:

- presents a short product overview and installation cues on the homepage
- embeds a switchable live playground for all package variants: `react`, `form`, `jquery`, `js2form`, `core`, and `form-data`
- exposes API reference content from `docs/api.md`
- updates automatically on GitHub Pages whenever site code or `docs/` markdown changes

The site should feel like one coherent product surface: users read enough to understand the library, try the package variants immediately, and then jump into the API reference when they want exact signatures and defaults.

## Non-Goals

- Writing new API prose beyond adapting existing markdown for site rendering
- Adding a blog, changelog UI, search backend, or versioned docs system
- Changing package runtime behavior as part of the docs work
- Building a generic live code editor with arbitrary code execution

## Current State

The repository currently has two separate Vite apps:

- `apps/examples`: a browser demo for DOM, jQuery, js2form, and limited core/form-data flows
- `apps/react-playground`: a separate React-focused playground with its own styling and layout

Documentation is split again:

- `README.md` contains introductory and usage content
- `docs/api.md` contains the package-by-package reference
- GitHub Pages deploys only `apps/examples/dist`

This structure makes the React experience and the reference docs feel detached from the main documentation entry point.

## Proposed Architecture

## Framework Choice

Create a new `apps/docs` site using Astro.

Why Astro:

- static-site-first and easy to deploy on GitHub Pages
- strong markdown support for rendering `docs/` content without inventing a custom parser
- supports React islands for the `@form2js/react` playground while also handling non-React interactive demos cleanly
- flexible enough to build a polished landing page instead of a docs-theme-only site

## Route Structure

The public site will have two primary routes:

- homepage route: short overview content plus the unified playground
- API docs route: API reference rendered from `docs/api.md`

Canonical route contract:

- the homepage is the docs site root with the active GitHub Pages base path
- the API docs route uses a trailing slash form under that base path
- internal page links and CTAs must be generated relative to the configured site base path rather than hard-coded root-relative strings
- query parameters such as `?variant=react` apply only to the homepage route

Optional future docs pages may live under the API docs area or a later docs area, but the initial implementation only needs:

- homepage
- API reference page

The site navigation should expose only:

- `Overview`
- `API Docs`

The homepage itself contains the playground, so there is no separate top-level playground route in the initial IA.

## Visual Direction

Use the current `apps/examples` aesthetic as the base visual language:

- dark IDE-inspired surface palette
- monospace accents for package labels, paths, and output
- split-panel inspector feel for the playground
- restrained neon accent treatment

The React playground should be visually absorbed into this design system rather than preserving its current lighter standalone theme.

The homepage should still feel like documentation, not only a demo app. The top section must include:

- short statement of what `form2js` is
- concise install/start cues
- links to `API Docs`
- compact package overview so users understand the variant switcher before interacting with it

## Information Architecture

## Homepage

The homepage layout should contain these sections, in order:

1. Hero
2. Package overview
3. Unified playground
4. API docs callout

Homepage overview, package-overview, and install copy are owned directly in `apps/docs`. They may be informed by `README.md`, but `README.md` is not the source of truth for homepage content.

For the six package-specific labels, summaries, and package-name lists shown in both the homepage package overview and the playground header, `VariantRegistry` is the single source of truth. The homepage overview cards and the playground header must both render from that shared registry metadata.

### Hero

Purpose:

- explain what the library family does in one screen
- give users an immediate install path
- make `API Docs` discoverable without scrolling

Contents:

- product name and short positioning copy
- one short install example
- primary CTA anchored to the playground section
- secondary CTA linking to the API docs route using the site base path

The hero install example is static for the first implementation; it does not change with the active variant.

### Package Overview

Purpose:

- explain the differences between package variants before the user switches demos

Contents:

- compact cards or a structured grid for `react`, `form`, `jquery`, `js2form`, `core`, and `form-data`
- one-sentence “use it when…” explanation per package

### Unified Playground

Purpose:

- act as the main interactive learning surface for the site

Structure:

- one shared shell with variant switcher
- one active variant at a time
- URL state persisted through the `variant` query parameter so links can deep-link to a variant, for example `?variant=react` on the current docs homepage pathname

Behavior:

- changing variant updates the visible demo and route state
- each variant must keep its own local input/output state during the current page session, so switching between variants does not wipe all work
- the shared shell should keep consistent framing, while the demo body changes per package
- changing variants should update the URL with `history.replaceState`, and browser back/forward behavior does not need per-switch history entries in the first implementation

### API Docs Callout

Purpose:

- give users a clear next step after trying the demos

Contents:

- short copy explaining that exact signatures, defaults, and compatibility notes live in the API reference
- link to the API docs route using the site base path

## API Docs Page

The API docs page should use a documentation layout rather than the playground shell.

Contents:

- page title and intro derived from the markdown source H1 and opening intro content
- rendered contents of `docs/api.md` starting at the first `h2` section
- generated table of contents

Navigation behavior:

- desktop: keep the site-level `Overview` / `API Docs` nav in the top header, and use a left sidebar for the in-page API table of contents
- mobile: collapsible “On this page” control
- active section highlight as the user scrolls
- heading anchor links for shareable deep links

The API page should be able to render markdown updates from the `docs/` directory without requiring manual duplication into Astro page files.

The API TOC should include `h2` and `h3` headings from the rendered markdown, using the same generated slugs as the page anchor links.

Slug generation must be deterministic and unique for repeated headings. TOC entries, heading anchors, and active-section highlighting must all use the exact deduplicated slugs emitted by the markdown pipeline.

## Docs Rendering Boundaries

The docs-reference side of the site should be broken into explicit units:

- `ApiDocsPage`: Astro page route for `/api/`
- `ApiDocsSource`: build-time markdown loader for `docs/api.md`
- `ApiDocsLayout`: page layout with intro, sidebar slot, and main content slot
- `ApiToc`: generated heading tree and active-section highlight behavior

Boundary responsibilities:

- `ApiDocsPage` loads the markdown source and passes rendered content plus heading metadata into the layout
- `ApiDocsSource` is the only application-level unit allowed to know where `docs/api.md` lives on disk
- `ApiDocsLayout` composes `DocsShell`, then adds API-page-specific intro, sidebar, and main-content structure inside it
- `ApiToc` owns heading link rendering and active-section scrollspy behavior

This keeps markdown loading, layout, and section-highlighting independently understandable and testable.

## Content Pipeline

## Source of Truth

`docs/api.md` remains the source of truth for API reference content.

The docs site should import and render that markdown through one explicit markdown pipeline in `ApiDocsSource`. The implementation must not create a second hand-maintained copy of the API reference inside the app.

Because the markdown file lives outside `apps/docs`, the docs app configuration must explicitly support reading repository-level `docs/` content during both development and production build. The plan must include the Astro/Vite configuration needed to allow filesystem access to the repo `docs/` directory and keep markdown edits visible in local docs development.

That filesystem configuration is build tooling, not application content ownership, so it does not conflict with `ApiDocsSource` being the only app-level module that resolves the markdown source path.

`ApiDocsSource` output contract:

- rendered markdown content suitable for direct page rendering in Astro
- heading metadata for all rendered `h2` and `h3` sections
- slugs generated from the same markdown pipeline used for rendered heading anchors
- local development must hot-reload when `docs/api.md` changes
- the source markdown H1 text and intro content extracted for page-level reuse so the API page does not render a duplicate top-level heading

If there is no prose between the markdown H1 and the first `h2`, that is a valid source shape and the page-level intro is empty rather than duplicated from the first section.

Markdown link policy:

- heading anchors in `docs/api.md` must resolve within the rendered API page using the deduplicated slug contract
- repo-relative markdown links should be rewritten to site routes when the target is part of the docs site
- unsupported repo-relative links or assets should resolve to the GitHub repository view rather than rendering as broken local paths

Required `docs/api.md` source shape:

- exactly one top-level H1
- optional intro prose between the H1 and first `h2`
- zero or more `h2` sections after that

Invalid source shape should fail the docs build if:

- the H1 is missing
- more than one H1 is present

Other heading issues do not fail the build:

- repeated `h2`/`h3` labels are tolerated and must use deterministic deduplicated slugs
- malformed lower-level headings may render without TOC entries, but the page body should still render

## Automatic Updates

Changes to either of these areas must trigger the same Pages deployment pipeline:

- `apps/docs/**`
- `docs/**`
- `packages/**`

Because GitHub Pages is already deployed from Actions on every push to `master`, automatic updates are satisfied by:

- building the docs site in the Pages workflow
- ensuring the site build reads current markdown from `docs/`

No additional content sync step is needed if the markdown file is rendered directly at build time.

## Playground Architecture

## Shared Boundaries

Break the playground into well-defined units:

- `DocsShell`: top-level site layout and nav
- `PlaygroundShell`: one client-side React island on the homepage that owns the switcher, URL synchronization, and demo mounting
- `VariantRegistry`: metadata describing each package option, label, summary, and component
- one isolated demo module per package variant
- `VariantHeader`: shared per-variant header chrome
- `ReactInspectorPanel`: shared output/status UI for React-category variants
- `StandardResultPanel`: shared output/status UI for non-React variants
- small shared presentational components such as code panes, badges, and field groups only where duplication actually appears during implementation

Each variant module must be understandable independently and own its own interaction logic. The switcher should not know implementation details of any package beyond metadata and mount points.

Ownership rules:

- `PlaygroundShell` owns the shared frame, active-variant selection, URL synchronization, and panel-level error boundary
- `PlaygroundShell` owns the shared per-variant header chrome using `label`, `summary`, and `packages` from `VariantRegistry`
- shell-selected shared panels own all output and error UI rendering from `outputState`
- each variant module owns only its editable inputs, raw state, and `outputState` emission
- a variant failure must never take down the switcher or other already-mounted variants

## Variant Output Contract

Variant modules must not pre-render their own shared output chrome. Each variant component is rendered by `PlaygroundShell` with an `onOutputChange(outputState)` callback, and `outputState` is the only cross-boundary payload consumed by the shared output helpers.

`VariantComponentProps` must include:

- `isActive`: whether the variant is currently the visible panel
- `onOutputChange(outputState)`: required callback whenever the variant's shared output state changes
- `reportFatalError(errorInfo)`: required callback for fatal post-mount failures that should move the variant into the shell-owned failed state

`outputState` must be a serializable discriminated union with these states:

- `idle`: seeded initial state before the user runs an action
- `running`: action in progress
- `success`: parsed payload available
- `error`: user-visible error available

Required shared fields:

- `kind`: `react` or `standard`
- `status`: one of `idle`, `running`, `success`, `error`
- `statusMessage`: short human-readable summary

React `outputState` fields:

- `submitFlags`: `isSubmitting`, `isError`, `isSuccess`
- `error`: serialized error object or `null`
- `parsedPayload`: last successful parsed payload or `null`
- `meta`: optional serializable inspector metadata

Standard `outputState` fields:

- `errorMessage`: string or `null`
- `parsedPayload`: parsed payload or `null`

Emission rules:

- each variant must emit its seeded `idle` `outputState` on initial mount
- `PlaygroundShell` treats the latest emitted `outputState` as the authoritative shared output for that variant
- input edits alone do not clear the latest `success` or `error` output; shared output changes only when the variant emits a new `outputState`
- a run action must emit `running` before producing `success` or `error`

React-category variants provide:

- live submit-state flags
- current error value
- last successful parsed payload
- any variant-specific inspector metadata needed by the shared React inspector panels

Non-React variants provide:

- current status message
- current error message, if any
- current parsed payload, if successful

Ownership split:

- variants own raw state and payload generation
- `VariantHeader`, `ReactInspectorPanel`, and `StandardResultPanel` own formatting, syntax highlighting, badges, and all status/error presentation
- `PlaygroundShell` chooses which shared output panel to render for the active variant
- `PlaygroundShell` stores the latest `outputState` per mounted variant and passes it to the correct shared helper for the active variant
- shared helpers consume only `outputState`; they do not reach into variant internals

## Variant Contract

Every playground variant must conform to one outward contract inside the docs app, even if its internals use imperative DOM logic:

- stable `id`: one of `react`, `form`, `jquery`, `js2form`, `core`, `form-data`
- `label`: user-facing switcher label
- `summary`: one-sentence “use it when…” copy
- `packages`: package names surfaced in the UI
- `kind`: `react` or `standard`
- `createInitialOutputState()`: returns the seeded `idle` output state for that variant
- `Component`: React component rendered by `PlaygroundShell`

This means:

- the docs homepage hydrates one React playground island
- `PlaygroundShell` reads and validates the `variant` query parameter
- `VariantRegistry` resolves the active variant metadata and component
- `PlaygroundShell` creates the seeded `idle` output state from `VariantDefinition.createInitialOutputState()`
- each variant component owns its own local inputs, outputs, and inline error state
- `PlaygroundShell` reads `kind` and `createInitialOutputState()` from the active `VariantDefinition`
- non-React package demos may wrap imperative helpers internally, but they still present a React component boundary to the shell
- browser-dependent variant logic must execute only on the client; no variant may touch `window`, `document`, jQuery plugin installation, or form elements at module top level or during SSR/build evaluation

Imperative integrations that need one-time browser-only setup, such as jQuery plugin installation, must live in a dedicated client-only bootstrap module invoked by the owning variant after mount. That bootstrap is not owned by `PlaygroundShell`.

Fatal-error taxonomy:

- recoverable user-facing failures belong in `outputState.error` or `errorMessage`, such as validation failures, JSON parse failures, and expected callback failures
- fatal failures enter the shell-owned `failed` state, including render-time crashes, effect/setup crashes, client-only bootstrap failures, and uncaught async/event-handler failures explicitly reported through `reportFatalError(errorInfo)`
- if a first-activation bootstrap step fails before normal interaction begins, the owning variant must report that fatal failure through `reportFatalError(errorInfo)` as soon as client setup runs

`errorInfo` contract:

- `message`: short user-visible summary
- `source`: one of `render`, `effect`, `bootstrap`, `event`, `async`
- `detail`: optional serialized diagnostic string for debugging

Failed-panel fallback contract:

- concise failure message using `errorInfo.message`
- variant label so the user knows which demo failed
- no retry control in the first implementation
- switching to other variants remains available

To preserve state without eagerly hydrating every demo at initial load, `PlaygroundShell` should lazily mount variants on first activation and keep visited variants mounted but hidden afterward. This preserves inputs and output history when the user switches variants during one page session, while avoiding first-load hydration for all six demos.

Containment rules for imperative variants:

- setup must happen only after client mount inside the variant component
- any event listeners, timers, or plugin wiring must be scoped to the variant root and cleaned up on unmount
- DOM queries must be limited to the variant root container, not `document`-wide selectors
- global mutation is disallowed unless it is explicitly idempotent and required for package setup
- hidden-but-mounted variants must not continue background work beyond retaining state

Hidden-variant lifecycle rules:

- switching variants does not unmount already-visited variants
- in-flight async work may finish while a variant is hidden, and the variant may update its stored `outputState`
- hidden variants must not start new polling, timers, or background work solely because they remain mounted
- variants receive `isActive=false` while hidden and may use that only to suppress visible-only work; they must not clear preserved state when becoming inactive
- when a user returns to a hidden variant, its last input state and `outputState` must still be visible
- if a variant entered an error state before being hidden, that state remains until the variant emits a new `outputState` from a rerun or until the page is refreshed
- panel-level lifecycle states are `unvisited`, `active`, `hidden`, and `failed`
- if a variant reaches `failed`, the shell stores only the failure fallback for that variant instead of preserving prior interactive state
- returning to a `failed` variant shows the same fallback state; recovery is only by full page refresh in the first implementation
- switching to another variant after a failure must continue to work normally

## Canonical Variant Definitions

Use these stable identifiers everywhere: registry, URL state, tests, and analytics if added later.

| ID | Label | Scope |
| --- | --- | --- |
| `react` | `React` | `@form2js/react` hook demo with schema validation and async submit state |
| `form` | `Form` | `@form2js/dom` and legacy `form2js()` parsing from an editable browser form |
| `jquery` | `jQuery` | `@form2js/jquery` plugin demo with selectable mode |
| `js2form` | `js2form` | object-to-form application and parsed result loop |
| `core` | `Core` | raw parser demo using editable JSON entry objects |
| `form-data` | `FormData` | `formDataToObject` demo using editable tuple entries |

The homepage URL state should use only query parameters, not hash fragments. The canonical format is `?variant=<id>` on the current homepage pathname, for example `?variant=react` or `?variant=form-data`.

If the query parameter is missing or invalid, the shell should default to `react`.

When updating URL state, `PlaygroundShell` must preserve the current pathname and active GitHub Pages base path. It should update only the query string on the current docs homepage URL rather than constructing root-relative paths.

## Variant Definitions

### React

Keep the current teaching goal from `apps/react-playground`:

- nested form names
- schema validation using Zod
- async submit lifecycle
- visible success and error state
- parsed result output

This variant should remain a React island inside Astro.

The seeded React demo must include these concrete controls and paths:

- default valid field values so the success path works immediately
- a submit button
- a reset-state button
- a visible validation failure path triggered by clearing or invalidating seeded fields such as first name, email, or age
- a visible callback failure path triggered by a dedicated “simulate request failure” toggle
- inspector output showing submit-state flags, current error output, and the last successful parsed payload
- `Reset state` emits the seeded `idle` output state for the React variant

### Form

Evolve the current DOM parser demo from `apps/examples`:

- editable browser form
- buttons for `@form2js/dom` and legacy `form2js()`
- parsed JSON output

This variant demonstrates standard form parsing with minimal abstraction.

Required seeded experience:

- seeded fields for nested names, select input, checkbox array, and boolean checkbox
- `Run @form2js/dom` action
- `Run form2js()` action
- success output: formatted parsed object for the current form state
- error output: shown through `StandardResultPanel`, though normal seeded flows should remain valid

### jQuery

Retain the current plugin demo pattern:

- jQuery-managed source forms
- selectable mode
- parsed output

Required seeded experience:

- two seeded source form fragments matching the current plugin example style
- supported mode selector pinned to `first`, `all`, and `combine`
- `Run @form2js/jquery` action
- success output: formatted parsed object for the selected mode
- error output: shown through `StandardResultPanel`, though normal seeded flows should remain valid

### js2form

Retain the current object-to-form teaching loop:

- editable JSON input
- apply to form
- show resulting parsed form state
- reset action

Required seeded experience:

- seeded JSON object matching the visible target form fields
- `Apply js2form` action
- `Reset form` action
- success output: parsed object after applying the JSON to the form
- error output: shown through `StandardResultPanel` for invalid JSON
- `Reset form` emits the seeded `idle` output state for the js2form variant

### core

Use a structured text editor input for raw entry data.

Required seeded experience:

- editable JSON array of `{ "key": string, "value": unknown }` objects
- run action calling `entriesToObject`
- success output: formatted parsed object
- error output: shown through `StandardResultPanel` for invalid JSON

This variant demonstrates the parser without DOM assumptions.

### form-data

Use a structured text editor input representing form-data-like entries.

Required seeded experience:

- editable JSON array of `[key, value]` tuples
- run action calling `formDataToObject`
- success output: formatted parsed object
- error output: shown through `StandardResultPanel` for invalid JSON

This variant demonstrates the same naming semantics through the `FormData`-oriented API.

## Shared UX Rules

- every variant must show the package name and one-sentence explanation
- every variant must expose editable inputs and visible output without navigation away from the homepage
- every run path must produce either formatted JSON output or a visible error message
- output formatting and syntax highlighting should be consistent across variants
- every variant must preserve its local input and output state when the user switches away and returns during the same page session
- a full page reload may reset the demo back to its seeded default example state
- the variant switcher must be keyboard operable, visibly focused, and expose semantic tab or button behavior
- the mobile “On this page” control must be keyboard operable and expose an accessible label
- heading anchors must remain keyboard reachable and visibly focusable
- failed-state and error-state UI must expose text that is readable without relying only on color

## Error Handling

The site must degrade clearly rather than silently failing.

### Playground Errors

- invalid JSON in `core`, `form-data`, or `js2form` inputs shows inline parse errors in the result/status area
- React validation and simulated callback errors remain visible in the React inspector
- if a variant throws during render or initialization, `PlaygroundShell` must isolate the failure to the active demo panel, keep the variant switcher usable, and show a non-retrying fallback message; in the first implementation, failed variants stay failed until full page refresh

### Docs Rendering Errors

- if `docs/api.md` is missing at build time, the build should fail rather than shipping an incomplete reference page
- if markdown headings are malformed, the page should still render content, but missing TOC entries are acceptable as a content-authoring issue rather than a runtime fallback concern

## Deployment and Build

## Workspace Changes

Add a new workspace app:

- `apps/docs`

The old apps should stop being the public deployment targets once their relevant logic is migrated:

- `apps/examples`
- `apps/react-playground`

They may remain temporarily during migration, but the required final state is:

- GitHub Pages deploys only `apps/docs`
- `apps/examples` and `apps/react-playground` are removed from the workspace after their logic, styles, and smoke coverage are migrated
- any retained smoke coverage moves into `apps/docs/test/`
- root scripts and README guidance no longer point users at the old standalone apps

## GitHub Pages Workflow

Replace the current Pages build target from `apps/examples/dist` to the built output of `apps/docs`.

The Pages workflow should:

1. install dependencies
2. build workspace packages
3. build the docs app with the Pages base path
4. upload the docs app build output

The workflow naming should also be updated from playground-only wording to docs-site wording.

Workspace package integration contract:

- `apps/docs` imports the local workspace package entrypoints in dev, test, and production build
- the docs app does not import built `dist` files directly as its primary dependency model
- CI and Pages still build workspace packages before the docs app build as an explicit integration check that package builds remain healthy

## Migration Strategy

Implement in these milestones:

1. `apps/docs` foundation
   scaffold Astro, wire the workspace, add base layout, and establish route/test/build structure
2. Homepage and playground shell
   create homepage sections, shared visual language, `VariantRegistry`, `VariantHeader`, and output panels
3. Demo migration
   port the six variants into the unified playground with state preservation and error boundaries
4. API docs pipeline
   render `docs/api.md`, TOC, anchors, and active-section highlighting through `ApiDocsSource`
5. Verification and cutover
   add browser E2E coverage, update root scripts, switch the Pages workflow, and update README links
6. Legacy cleanup
   remove `apps/examples` and `apps/react-playground` once the new site is verified

This order keeps deployment changes until the site is ready and reduces the risk of temporarily breaking the public Pages site.

## Testing and Verification

## Automated Checks

The new docs app must participate in the existing repo checks:

- lint
- typecheck
- build
- test

Add these required smoke tests for the docs site:

- homepage renders
- variant switcher changes visible content
- `?variant=<id>` deep-links to the requested variant on the current homepage pathname for all canonical IDs
- invalid `variant` values fall back to `react`
- per-variant state is preserved when switching away and back during one page session
- active-demo failures are isolated to the panel and leave the switcher usable
- returning to a failed variant shows the same fallback state until full page refresh
- API docs page renders expected heading content from `docs/api.md`
- API docs page renders TOC entries for expected `h2` and `h3` headings
- API heading anchor links resolve to the rendered sections
- API active-section highlighting responds to scroll position
- variant switcher supports keyboard navigation with visible focus
- mobile “On this page” control is keyboard operable
- missing `docs/api.md` fails the docs build
- site works with the GitHub Pages base path configuration used in the Pages workflow

Existing package tests are not expected to change unless demo extraction accidentally alters package code.

The docs app smoke tests should live with the docs workspace so CI ownership is clear, for example under `apps/docs/test/`.

Testing integration:

- keep unit-level component and helper checks in the docs workspace test suite
- use browser E2E smoke tests for behaviors that depend on real navigation, scrolling, lazy mounting, or browser URL/base-path behavior
- browser E2E smoke tests are in scope for this project and should be wired into the docs app `test` script so root `npm run test` covers them
- browser E2E smoke tests should run against a built-and-previewed docs app rather than only a dev server, so base-path and production-routing behavior are exercised
- root scripts must be updated so `npm run test` includes the docs workspace tests in addition to existing package and integration tests
- failure-isolation tests must use a deterministic test-only fault-injection seam in the docs app so render/bootstrap/event failures can be triggered without modifying production behavior

After migration, the local developer entry point should also move to the docs app, with root-level scripts updated accordingly, for example `npm run docs` for local development of the unified site.

## Manual Verification

Before considering the work complete, verify:

- homepage works under the GitHub Pages base path
- switching across all six variants renders the expected demo and output area
- React demo still covers success, validation failure, and callback failure
- `core`, `form-data`, and `js2form` invalid JSON paths show understandable errors
- `/api/` displays the markdown content with a working TOC and active section highlight
- navigation between homepage and API docs works on desktop and mobile sizes

## Risks and Constraints

- Astro integration adds a new framework to the repo, so boundaries between Astro pages, React islands, and vanilla demo code must stay clear
- the homepage can become too heavy if all variants hydrate eagerly; implementation should prefer lazy or selective hydration where possible
- API markdown rendering must avoid drift from `docs/api.md`; direct build-time rendering is required to keep the docs trustworthy

## Success Criteria

The work is successful when:

- GitHub Pages serves one documentation site instead of the old split example setup
- the homepage combines short docs content with a working multi-package playground
- the API reference is available on a dedicated page rendered from `docs/api.md`
- updates to `docs/api.md` appear on the deployed site through the normal Pages workflow
- users can understand package differences, try them, and reach exact reference material without leaving the docs site
