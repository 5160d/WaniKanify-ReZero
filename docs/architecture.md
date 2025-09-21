# Architecture Overview

WaniKanify ReZero follows a standard Chrome MV3 architecture built on top of the Plasmo framework.

## High-level components

- **Background service worker (`src/background.ts`)**
  - Manages WaniKani API interactions, vocabulary caching, spreadsheet imports, and settings synchronisation.
  - Uses `ExtensionStorageService` for compressed storage and listens for storage changes to refresh vocabulary.
  - Broadcasts state (settings, cache, performance metrics) to interested clients.

- **Content script (`src/content.ts`)**
  - Loads user settings, site overrides, and vocabulary from the background worker.
  - Utilises `TextReplacementEngine` to walk DOM text nodes, replace content, track statistics, and trigger audio playback.
  - Observes DOM mutations, debounces large updates, and coordinates site exclusion logic.

- **UI surfaces (`src/options.tsx`, `src/popup.tsx`)**
  - Options page provides full settings management, import/export utilities, live preview, and spreadsheet import tooling.
  - Popup offers quick API token entry, save feedback, and replacement statistics.

- **Services layer (under `src/services/`)**
  - `wanikani.ts`: REST client with caching/rate limiting.
  - `vocabulary.ts`: merges custom/imported/WaniKani data and produces lookup structures and tries.
  - `textReplacer.ts`: performs DOM-safe replacements with undo tracking and number conversion.
  - `siteFilter.ts`: handles blacklist pattern matching and overrides.
  - `spreadsheetImport.ts`: fetches published Google Sheets CSV data, validates columns, and records import history.
  - `storage.ts`: wraps Plasmo storage with compression, migrations, and quota utilities.
  - `audio.ts`: handles audio playback modes and caching.

## Data flow summary

1. **Background** fetches WaniKani data and imported spreadsheets, builds a cache via `VocabularyManager`, and persists it using the storage service.
2. **Content script** loads settings + vocabulary, applies filters via `SiteFilter`, and uses `TextReplacementEngine` to modify the DOM.
3. When settings change, both background and content scripts respond via storage listeners to update their local state.
4. The popup and options UI interact with the background worker through `chrome.runtime.sendMessage` (e.g., fetching state, requesting refreshes).

## Performance considerations

- Mutations are batched and processed using idle callbacks to avoid overwhelming the main thread.
- Replacement rules are lazily compiled and truncated when vocabulary changes rapidly.
- Spreadsheet imports run off the main UI thread and store aggregated results for reuse.

Refer to the individual service files for deeper details.
