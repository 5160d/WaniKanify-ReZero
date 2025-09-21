# Developer Setup Guide

Prerequisites:
- Node.js LTS (with npm)
- WaniKani API token (optional for live API integration)

Setup steps:
1. Clone the repository.
2. Install dependencies with `npm install` (or `pnpm install`).
3. Run `npm run dev` to start the development server. For production artifacts use `npm run build:all` (recommended) which builds & packages Chrome + Firefox bundles.
4. Execute `npm test` for unit tests. For Playwright end-to-end tests, run `npx playwright install` once and then `npm run test:e2e`.
5. To reset extension data during development, clear the `WaniSettings` key via the browser extension storage inspector.

## Testing Commands

### Unit Tests
- `npm run test` - run Jest unit tests for services, components, and utilities

### End-to-End Tests  
- `npm run test:e2e` - run all Playwright tests
- `npx playwright test extension --project=chromium` - run Chrome extension integration tests (only test suite)
- `npx playwright install` - one-time setup to download browser binaries

### Development Commands
- `npm run dev` - start Plasmo in watch mode
- `npm run build:all` - create Chrome + Firefox production directories and ZIP archives
- `npm run build` - build only (current default target: chrome-mv3)
- `npm run package` - package whatever targets were last built

## Test Coverage

The project uses Playwright extension tests:

**Extension Integration Tests** (`tests/e2e/extension.spec.ts` + `tests/e2e/fixtures.ts`)
- Tests complete Chrome extension functionality using official Playwright extension testing methodology
- Validates extension loading, popup, options page, content processing, and storage configuration
- Chrome/Chromium only (Playwright extension testing limitation)
- 5 comprehensive tests covering all extension aspects

## Packaging for release

### Recommended (all targets in one step)
1. Run `npm run build:all`.
2. Artifacts produced in `build/`:
	- `chrome-mv3-prod/` + `chrome-mv3-prod.zip`
	- `firefox-mv3-prod/` + `firefox-mv3-prod.zip`
3. Upload:
	- Chrome Web Store / Edge Add-ons: `chrome-mv3-prod.zip`
	- Firefox AMO: `firefox-mv3-prod.zip`

### Advanced / single target
If you only need Chrome/Edge:
```bash
npm run build
npm run package
```
For Firefox only:
```bash
plasmo build --target=firefox-mv3
plasmo package
```
Or specify multiple targets manually:
```bash
plasmo build --target=chrome-mv3,firefox-mv3
plasmo package
```
`npm run build:all` is a convenience wrapper for the multi-target build + package sequence.

## Environment Variables

These can be set ad-hoc in your shell before running commands. Do not commit secrets.

| Name | Purpose | When to Use | Default |
|------|---------|------------|---------|
| `WANIKANI_API_TOKEN` | Personal WaniKani API token used by the extension at runtime (entered in UI) and by optional live tests. | Supplying live tests or prefilling dev environment. | Not required for unit tests. |
| `WK_LIVE` | Enables live API Jest tests (`*live*.test.ts`). | When you want to verify real network integration (sparingly). | Off (tests skipped). |
| `SUPPRESS_ACT_WARNING` | Suppresses deprecated `ReactDOMTestUtils.act` console warnings in Jest output. | If warning noise obscures failures. | Off (warnings visible). |

### Running Live Tests (Use Sparingly)

Live tests make real HTTPS calls to the WaniKani API and therefore consume your personal rate limit quota. They are intentionally opt‑in.

PowerShell example:
```powershell
$env:WK_LIVE='1'; $env:WANIKANI_API_TOKEN='<your-token>'; npm test -- -- wanikani.live.test.ts
```

Bash/Zsh example:
```bash
WK_LIVE=1 WANIKANI_API_TOKEN=<your-token> npm test -- wanikani.live.test.ts
```

Common live test files:
* `wanikani.live.test.ts` – smoke: fetch subjects + assignments
* `wanikani.incremental.live.test.ts` – validates `updated_after` incremental fetch merging
* `background.live.test.ts` – minimal background refresh simulation

Guidelines:
* Run no more than occasionally (e.g. before a release) unless actively debugging API behavior.
* Avoid parallelizing multiple live test runs; let one finish to stay within rate limits.
* If you see duplicate IDs in incremental logs, this is expected due to API inclusivity at the boundary timestamp and is handled by merge logic.

To suppress the non-fatal React Testing Library act deprecation warning during local runs:
```powershell
$env:SUPPRESS_ACT_WARNING='1'; npm test
```
Leave it unset in CI if you prefer visibility.
