# Troubleshooting Guide

## Playwright E2E tests fail with missing browsers
Run `npx playwright install` once to download Chromium, Firefox, and WebKit binaries, then re-run `npm run test:e2e`.

## Spreadsheet import returns warnings
Ensure the sheet is published to the web (Google Sheets -> File -> Share -> Publish to web) and that column names match the configuration exactly. Check the history table for per-row warnings.

## WaniKani API requests fail
Verify the API token has read access, is entered correctly, and has not expired. Re-enter the token in the options page; the background console logs the HTTP status for failed calls.

## Text not replaced on certain sites
The site might be blocked by the filtering settings. Review the "Behavior" tab, the site overrides, and use the toolbar icon to toggle replacements if needed.

## Storage errors or exceeded quota
The background worker logs warnings when storage usage climbs above 80 percent of the available quota. Remove unnecessary spreadsheet imports or custom vocabulary entries, then rebuild the cache from the options page.

## Performance issues on large pages
Pages with many text nodes (>6000) automatically use time-sliced processing to prevent browser freezing. If you experience performance issues, check the browser console for processing strategy logs. Consider adding problematic sites to the filtered websites list if replacements aren't critical.

## Jest suite fails due to environment issues
Run `npm install` to ensure dev dependencies are present. If you see ESM parsing errors, confirm `tsconfig.jest.json` sets `module` to `commonjs`, then retry `npm test`.
