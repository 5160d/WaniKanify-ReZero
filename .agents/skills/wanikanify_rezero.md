---
name: WaniKanify-ReZero Agent Guide
description: Documentation for understanding, building, testing, and developing the WaniKanify-ReZero browser extension.
---

# WaniKanify-ReZero Project Guide

WaniKanify-ReZero is a browser extension tool that replaces English text on web pages with Japanese vocabulary. It integrates directly with the user's WaniKani account to fetch vocabulary based on their Spaced Repetition System (SRS) levels.

This document contains everything an AI agent needs to know to operate smoothly within this codebase.

## Technology Stack

- **Framework**: [Plasmo](https://docs.plasmo.com/) (Browser Extension Framework)
- **UI & Components**: React 18, Material UI (MUI) 5
- **Styling**: Tailwind CSS, custom MUI themes
- **Language**: TypeScript
- **Testing**: Jest (Unit Tests), Playwright (E2E Tests)
- **Package Manager**: pnpm (or npm)

## Core Architecture

The extension is structured around typical Chrome MV3 architecture elements:

- **Background Script (`src/background.ts`)**:
  - Manages the WaniKani API cache, settings synchronization, and handles background data fetching (like spreadsheets).
  - Uses `ExtensionStorageService` for data management and compressed storage.
  - Automatically schedules cache refresh alarms every 6 hours.

- **Content Script (`src/content.ts`)**:
  - Responsible for replacing text on the active web page.
  - Analyzes page complexity:
    - **Light pages (< 4000 text nodes)**: batch processing using `FastAhoCorasickReplacer`.
    - **Heavy pages (>= 4000 text nodes)**: time-sliced processing to avoid blocking the main thread.
  - Lazily compiles vocabulary tries and responds to DOM mutations and settings changes.

- **UI Surfaces**:
  - `src/options.tsx`: The primary settings page, fully featured for configuring the extension.
  - `src/popup.tsx`: The quick-access popup menu from the extension icon.

- **Services (`src/services/`)**:
  - API communication (`wanikani.ts`)
  - Fast replacement engine (`fastAhoCorasickReplacer.ts`)
  - Data processing and tree building (`vocabulary.ts`)

## Commands and Workflow

### Running Locally
- Start the Plasmo development server in watch mode:
  ```bash
  pnpm dev
  ```

### Building for Production
- **Recommended**: Build and package artifacts for both Chrome/Edge and Firefox simultaneously.
  ```bash
  pnpm build:all
  ```
  Artifacts will be dropped in `build/` (e.g. `chrome-mv3-prod.zip`, `firefox-mv3-prod.zip`).

### Testing
- **Unit Tests** (Runs Jest on `src/` and `__tests__/` without live WaniKani API calls):
  ```bash
  pnpm test
  ```
- **Live WaniKani Tests** (Highly discouraged for routine runs to preserve rate limits):
  ```bash
  WK_LIVE=1 WANIKANI_API_TOKEN=<token> pnpm test -- wanikani.live.test.ts
  ```
- **End-to-End Tests** (Playwright):
  ```bash
  pnpm test:e2e
  ```

## Quality Enforcement & Pre-commit Hooks

This project has strict Husky pre-commit hooks that an AI agent should be aware of before modifying code, specifically around Localization (i18n):

1. **Localization Storage**: Keys live in `locales/en/messages.json`.
2. **Hardcoded UI Strings**: The rule `local-i18n/hardcoded-ui-string` strictly prevents unlocalized UI strings. Always use `t('key')` from `src/utils/i18n.ts` instead of raw strings.
3. **Internal Tokens**: Purely technical identifiers (like message channels or DOM classes) must be prefixed with `__WK_` and stored in `src/internal/tokens.ts`. The rule `local-i18n/no-unregistered-internal-token` enforces this.
4. **Developer Logging**: The rule `local-i18n/no-raw-console` prevents using `console.log`. Instead, import and use the structured logger:
   ```typescript
   import { log } from '~src/utils/log'
   log.debug('[WK] doing something internally', meta)
   ```
5. **Key Generation Pipeline**: If you add a new localization key, you must manually run the generation script to update the types, otherwise the CI check (`pnpm i18n:check`) will fail in the pre-commit hook.
   ```bash
   pnpm i18n:gen
   pnpm i18n:unused # verify it is used
   ```

## Development Guide / Summary

- Always use the `log` utility for internal console prints instead of `console.*`.
- Avoid hardcoding text meant for the user. Add it to `messages.json`, run `pnpm i18n:gen`, and use the `t()` functional wrapper.
- To inspect code changes locally, run `pnpm dev` and load the unpacked extension in your target browser from `build/chrome-mv3-dev`.
