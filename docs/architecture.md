# Architecture Overview

WaniKanify ReZero follows a standard Chrome MV3 architecture built on top of the Plasmo framework.

## High-level components

- **Background service worker (`src/background.ts`)**
  - Manages WaniKani API interactions, vocabulary caching, spreadsheet imports, and settings synchronisation.
  - Uses `ExtensionStorageService` for compressed storage and listens for storage changes to refresh vocabulary.
  - Broadcasts state (settings, cache, performance metrics) to interested clients.
  - Schedules a periodic vocabulary refresh alarm every 6 hours (1‑minute initial delay) and also refreshes immediately when the API token changes or the existing cache is expired/missing. Manual cache clearing triggers a rebuild on next access.

- **Content script (`src/content.ts`)**
  - Loads user settings, site overrides, and vocabulary from the background worker.
  - Utilises `TextReplacementEngine` to walk DOM text nodes, replace content, track statistics, and (when enabled) trigger audio playback.
  - Observes DOM mutations, debounces large updates, and coordinates site exclusion logic.
  - Performs an immediate first compile of the vocabulary automaton so early DOM (e.g. page titles) receives replacements without waiting for idle callbacks; a full reprocess is scheduled after background vocabulary state loads.

- **UI surfaces (`src/options.tsx`, `src/popup.tsx`)**
  - Options page provides full settings management, import/export utilities, live preview, and spreadsheet import tooling.
  - Live Preview mirrors runtime behaviour: tooltip enable/disable, number replacement wrapping, and audio click / hover playback use the same service code paths. Audio listeners are cleaned up via `AudioService.dispose()` on unmount to avoid test flakiness and stray handlers.
  - Popup offers quick API token entry, save feedback, and replacement statistics.

- **Services layer (under `src/services/`)**
  - `wanikani.ts`: REST client with caching/rate limiting.
  - `vocabulary.ts`: merges custom/imported/WaniKani data and produces lookup structures and tries.
  - `textReplacer.ts`: performs DOM-safe replacements with undo tracking and number conversion.
  - `siteFilter.ts`: handles blacklist pattern matching and overrides.
  - `spreadsheetImport.ts`: fetches published Google Sheets CSV data, validates columns, and records import history.
  - `storage.ts`: wraps Plasmo storage with compression, migrations, and quota utilities.
  - `audio.ts`: handles audio playback modes and caching.
    - Exposes `dispose()` to deterministically remove event listeners (used by Live Preview and tests).

## Data flow summary

1. **Background** fetches WaniKani data and imported spreadsheets, builds a cache via `VocabularyManager`, and persists it using the storage service.
2. **Content script** loads settings + vocabulary, applies filters via `SiteFilter`, and uses `TextReplacementEngine` to modify the DOM.
3. When settings change, both background and content scripts respond via storage listeners to update their local state.
4. The popup and options UI interact with the background worker through `chrome.runtime.sendMessage` (e.g., fetching state, requesting refreshes).
5. A Chrome alarms entry (`wanikanify:vocabulary-refresh`) fires every 6 hours; on trigger the background checks the current cache TTL and only performs a network fetch if the stored `expiresAt` has passed.

#### Incremental subject synchronization

The background script records `lastSubjectsUpdatedAt` (max `data_updated_at` among cached WaniKani vocabulary subjects). On subsequent refresh cycles, it calls the WaniKani `/subjects` endpoint with `updated_after=<lastSubjectsUpdatedAt>` to fetch only changed or newly added vocabulary subjects. Returned subjects are merged (replacing entries with the same `id`) and the timestamp is advanced. If no cache exists (first run or after a manual clear) a full fetch seeds the baseline. Assignments are fetched fully (endpoint does not support `updated_after`). This approach aligns with WaniKani API best practices by minimizing redundant data transfer and reducing rate‑limit pressure.

#### Conditional requests (assignments & subjects)

`/assignments` responses can be large but often do not change between refresh cycles. The client records the `Last-Modified` response header for assignments and sends it via `If-Modified-Since` on subsequent requests. A `304 Not Modified` causes the previously cached assignments collection (kept in a stale store independent of normal TTL eviction) to be reused with zero network payload beyond headers.

For `/subjects`, incremental sync already minimizes payload via the `updated_after` parameter. We still add conditional support so that when there are no changes the server can respond `304` instead of returning an empty collection body. Special handling returns an empty delta (rather than replaying the stale full dataset) when a 304 is received for an incremental (`updated_after`) request. This avoids unnecessary reprocessing work.

#### Persisted Last-Modified metadata

The background cache (`VocabularyCachePayload`) now stores `lastModifiedSubjects` and `lastModifiedAssignments`. On extension startup these values (plus the last full subject/assignment datasets) seed the client’s conditional metadata and stale value maps. This enables immediate conditional (`If-Modified-Since`) requests after a browser restart and allows 304 responses to short‑circuit large JSON bodies on the very first refresh of a new session.

### Vocabulary cache lifecycle

| Event | Action | Resulting TTL |
|-------|--------|---------------|
| Install / Update / Browser startup | Alarm scheduled (first run after 1 min) | 6h period maintained |
| Successful refresh | Cache stored with `expiresAt = now + 6h` | 6h |
| Network/API error | Error cache stored with `expiresAt = now + 5m` | 5m (retry sooner) |
| API token changed | Forced refresh bypassing TTL | 6h from success |
| Manual Clear Cache button | Cache removed; next usage forces refresh (if token present) | 6h from next success |

Worst‑case latency for newly released WaniKani vocabulary to appear (without manual actions) is just under 6 hours; average expected latency ~3 hours. Users wanting faster updates can clear the cache or (future enhancement) click a manual Refresh button.

## Performance considerations

- Mutations are batched and processed using idle callbacks to avoid overwhelming the main thread.
- Replacement rules are lazily compiled and truncated when vocabulary changes rapidly.
- Spreadsheet imports run off the main UI thread and store aggregated results for reuse.

Refer to the individual service files for deeper details.

## Custom / Blacklist Data Constraints

Soft caps guard against excessive sync storage consumption:

| List | Representation | De-duplication | Soft Cap | Notes |
|------|----------------|----------------|----------|-------|
| Custom Vocabulary | Map<english, { japanese, reading? }> | English keys unique; multiple synonyms per Japanese term serialize back into comma groups | 1000 unique English keys | Keeps trie size stable |
| Blacklisted Vocabulary | Set<string> | Automatic via Set | 1000 unique tokens | Fast membership tests & bounded memory |
