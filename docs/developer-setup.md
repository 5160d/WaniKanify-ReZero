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

- `WANIKANIFY_API_TOKEN` - optional token used during manual testing to avoid re-entering credentials
