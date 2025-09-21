# Developer Setup Guide

Prerequisites:
- Node.js LTS (with npm)
- WaniKani API token (optional for live API integration)

Setup steps:
1. Clone the repository.
2. Install dependencies with `npm install` (or `pnpm install`).
3. Run `npm run dev` to start the development server or `npm run build` to create a production bundle.
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
- `npm run build` - create production bundles in `build/`  
- `npm run package` - produce store-ready archives in `build/`

## Test Coverage

The project uses Playwright extension tests:

**Extension Integration Tests** (`tests/e2e/extension.spec.ts` + `tests/e2e/fixtures.ts`)
- Tests complete Chrome extension functionality using official Playwright extension testing methodology
- Validates extension loading, popup, options page, content processing, and storage configuration
- Chrome/Chromium only (Playwright extension testing limitation)
- 5 comprehensive tests covering all extension aspects

## Packaging for release

### Chrome / Edge (Chromium)
1. Run `npm run package`.
2. Upload the generated `build/chrome-mv3-prod.zip` to the Chrome Web Store.
3. Reuse the same ZIP for Microsoft Edge (rename the file if you prefer to keep a separate copy).

### Firefox
1. Build the Firefox bundle: `plasmo build --zip --target=firefox-mv3`.
3. Submit the resulting ZIP to AMO.

## Environment Variables

- `WANIKANIFY_API_TOKEN` - optional token used during manual testing to avoid re-entering credentials
