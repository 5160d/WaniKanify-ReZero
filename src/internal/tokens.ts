/**
 * @file src/internal/tokens.ts
 * @description Central registry of INTERNAL (non user‑visible) technical string literals.
 * All values share the sentinel prefix `__WK_` in their exported identifier so the
 * custom ESLint rule (hardcoded-ui-string) can ignore them via the configured
 * `sentinelPrefix` option. This keeps localization noise low and ensures
 * reviewers can quickly audit new technical strings.
 *
 * Conventions:
 * 1. Identifier: `__WK_<CATEGORY>_<NAME>` (UPPER_SNAKE) where category groups purpose (EVT, CLASS, DATA, ALARM, PORT, STORE, NS, SELECTOR).
 * 2. Value namespace: MUST begin with one of:
 *      - `wanikanify:`  (message channels, alarms, ports, storage, diagnostics)
 *      - `wanikanify-`  (CSS classes)
 *      - `data-wanikanify-` (data attributes)
 * 3. Never use these constants for user-facing copy; if UI text is needed, localize instead.
 * 4. When deprecating a token, remove it and update all references in the same commit.
 */

// Messaging / runtime events
export const __WK_EVT_GET_STATE = "wanikanify:get-state"
export const __WK_EVT_GET_SETTINGS = "wanikanify:get-settings"
export const __WK_EVT_REFRESH_VOCAB = "wanikanify:refresh-vocabulary"
export const __WK_EVT_REFRESH_IMPORTED_VOCAB = "wanikanify:refresh-imported-vocabulary"
export const __WK_EVT_REFRESH_STARTED = "wanikanify:refresh-started"
export const __WK_EVT_CLEAR_CACHE = "wanikanify:clear-cache"
export const __WK_EVT_PERFORMANCE = "wanikanify:performance"
export const __WK_EVT_STATE = "wanikanify:state"
export const __WK_EVT_SETTINGS = "wanikanify:settings"
export const __WK_EVT_ERROR = "wanikanify:error"
export const __WK_EVT_TOGGLE_RUNTIME = "wanikanify:toggle-runtime"
export const __WK_EVT_RUNTIME = "wanikanify:runtime"
export const __WK_EVT_NAVIGATION = "wanikanify:navigation"

// Ports
export const __WK_PORT_SAFE = "wanikanify:safe-port"

// Alarms
export const __WK_ALARM_VOCAB_REFRESH = "wanikanify:vocabulary-refresh"

// Storage keys / internal storage namespaces
export const __WK_STORE_SPREADSHEET_DATA = "wanikanify:spreadsheetData"
export const __WK_STORE_SPREADSHEET_HISTORY = "wanikanify:spreadsheetHistory"
export const __WK_STORE_SETTINGS_BACKUPS = "wanikanify:settingsBackups"

// Class names
export const __WK_CLASS_REPLACEMENT = "wanikanify-replacement"
export const __WK_CLASS_REPLACEMENT_CONTAINER = "wanikanify-replacement-container"
export const __WK_CLASS_TOOLTIP = "wanikanify-tooltip"
export const __WK_CLASS_TOOLTIP_AFTER = "wanikanify-tooltip-after"
export const __WK_CLASS_TOOLTIP_BEFORE = "wanikanify-tooltip-before"
export const __WK_CLASS_TOOLTIPS_DISABLED = "wanikanify-tooltips-disabled"

// Data attributes (used as attribute names or selectors; keep raw for flexibility)
export const __WK_DATA_CONTAINER = "data-wanikanify-container"
export const __WK_DATA_ORIGINAL = "data-wanikanify-original"
export const __WK_DATA_READING = "data-wanikanify-reading"
export const __WK_DATA_SKIP = "data-wanikanify-skip"

// Selectors built from the above (compose rather than create divergent strings)
export const __WK_SELECTOR_REPLACEMENT_CONTAINER_TRUE = `[${__WK_DATA_CONTAINER}='true']`

// Misc / namespace tokens
export const __WK_NS_VOCABULARY = "wanikanify-vocabulary"

// Utility: groupings (optional usage for iteration / validation / tests)
export const __WK_ALL_EVENTS = [
  __WK_EVT_GET_STATE,
  __WK_EVT_GET_SETTINGS,
  __WK_EVT_REFRESH_VOCAB,
  __WK_EVT_REFRESH_IMPORTED_VOCAB,
  __WK_EVT_REFRESH_STARTED,
  __WK_EVT_CLEAR_CACHE,
  __WK_EVT_PERFORMANCE,
  __WK_EVT_STATE,
  __WK_EVT_SETTINGS,
  __WK_EVT_ERROR,
  __WK_EVT_TOGGLE_RUNTIME,
  __WK_EVT_RUNTIME,
  __WK_EVT_NAVIGATION
] as const

export type WkInternalEvent = typeof __WK_ALL_EVENTS[number]

// Optional: frozen aggregate for ergonomic imports / debugging (not required by runtime logic)
export const __WK = Object.freeze({
  events: Object.freeze({
    GET_STATE: __WK_EVT_GET_STATE,
    GET_SETTINGS: __WK_EVT_GET_SETTINGS,
    REFRESH_VOCAB: __WK_EVT_REFRESH_VOCAB,
    REFRESH_IMPORTED_VOCAB: __WK_EVT_REFRESH_IMPORTED_VOCAB,
    REFRESH_STARTED: __WK_EVT_REFRESH_STARTED,
    CLEAR_CACHE: __WK_EVT_CLEAR_CACHE,
    PERFORMANCE: __WK_EVT_PERFORMANCE,
    STATE: __WK_EVT_STATE,
    SETTINGS: __WK_EVT_SETTINGS,
    ERROR: __WK_EVT_ERROR,
    TOGGLE_RUNTIME: __WK_EVT_TOGGLE_RUNTIME,
    RUNTIME: __WK_EVT_RUNTIME,
    NAVIGATION: __WK_EVT_NAVIGATION
  }),
  ports: Object.freeze({ SAFE: __WK_PORT_SAFE }),
  alarms: Object.freeze({ VOCAB_REFRESH: __WK_ALARM_VOCAB_REFRESH }),
  storage: Object.freeze({
    SPREADSHEET_DATA: __WK_STORE_SPREADSHEET_DATA,
    SPREADSHEET_HISTORY: __WK_STORE_SPREADSHEET_HISTORY,
    SETTINGS_BACKUPS: __WK_STORE_SETTINGS_BACKUPS
  }),
  classes: Object.freeze({
    REPLACEMENT: __WK_CLASS_REPLACEMENT,
    REPLACEMENT_CONTAINER: __WK_CLASS_REPLACEMENT_CONTAINER,
    TOOLTIP: __WK_CLASS_TOOLTIP,
    TOOLTIP_AFTER: __WK_CLASS_TOOLTIP_AFTER,
    TOOLTIP_BEFORE: __WK_CLASS_TOOLTIP_BEFORE,
    TOOLTIPS_DISABLED: __WK_CLASS_TOOLTIPS_DISABLED
  }),
  data: Object.freeze({
    CONTAINER: __WK_DATA_CONTAINER,
    ORIGINAL: __WK_DATA_ORIGINAL,
    READING: __WK_DATA_READING,
    SKIP: __WK_DATA_SKIP
  }),
  selectors: Object.freeze({
    REPLACEMENT_CONTAINER_TRUE: __WK_SELECTOR_REPLACEMENT_CONTAINER_TRUE
  }),
  namespaces: Object.freeze({ VOCABULARY: __WK_NS_VOCABULARY }),
  allEvents: __WK_ALL_EVENTS
})

