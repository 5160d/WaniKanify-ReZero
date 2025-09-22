# Localization & i18n Enforcement

This document explains the current localization system and how it is enforced.

## Goals
- Prevent accidental introduction of new hard‑coded English UI strings.
- Detect unintended duplicate localized message values that could cause ambiguity.
- Keep false positives extremely low by ignoring technical, styling, and developer‑only diagnostics.

## Overview
Localization keys live in `locales/en/messages.json` and are referenced in code via the `t(key)` function (`src/utils/i18n.ts`). ESLint now provides two custom rules under the internal plugin `eslint-plugin-local-i18n`:

| Rule | Purpose |
|------|---------|
| `local-i18n/hardcoded-ui-string` | Flags likely user-facing string literals that are not localized. |
| `local-i18n/duplicate-message-values` | Emits a single report listing unexpected duplicate message values. |

Enforcement is handled entirely through ESLint custom rules; no separate Jest heuristics are required.

## hardcoded-ui-string Rule
Heuristic steps:
1. Considers only string literals containing alphabetic characters and length ≥ 3.
2. Excludes: allowlisted short tokens (e.g. `OK`, `Yes`), all-uppercase constants, single identifiers, paths, code-ish tokens.
3. Rejects purely technical / stylistic literals via a curated regex list: CSS transforms, shadows, animation timing, keyframe names, color functions, file names, attribute names, storage / channel keys (`wanikanify:*`), palette references, dev diagnostics.
4. Skips literals that appear only inside `console.*` or logger calls (developer-only diagnostics).
5. A literal must look like natural language: contains a space OR ends with sentence punctuation OR has an ellipsis.
6. If inside a `t()` call already, it is ignored.

Additions should modify `TECH_PATTERNS` in `eslint-plugin-local-i18n/rules/hardcoded-ui-string.js`. Keep patterns narrowly scoped—prefer specific regex phrases over broad wildcards.

### When to Add a Pattern
Add an ignore pattern only if:
- The literal is not and will not become user-visible.
- The literal is a stable style token, diagnostic, selector, or structural value.

If in doubt, localize instead of ignoring.

## duplicate-message-values Rule
- Loads all English messages once per ESLint run.
- Groups by `message` value; reports values used by >1 key unless allowlisted or clearly a pattern/example (contains `*` or `^`).
- Emits findings only once (attached to the first `Program` node visited) to avoid noise.

To intentionally allow duplicate values (e.g., common single-word button labels), add the value to the rule's configuration allowlist in the ESLint config.

## Adding New Localized Strings
1. Add a new entry to `locales/en/messages.json`:
   ```jsonc
   "my_feature_action_label": { "message": "Do the Thing" }
   ```
2. (Optional) Run a key generation script if present (e.g., to refresh TypeScript definitions).
3. Replace the hardcoded literal with `t('my_feature_action_label')`.
4. Run `pnpm lint` to confirm no rule violations.

## Philosophy on Dev / Diagnostic Strings
Developer-only log lines (network traces, cache diagnostics, internal state transitions) are ignored intentionally—they provide debugging clarity and are not translated. If a string transitions to user-visible (e.g., appears in a UI alert or tooltip), localize it.

### Dev Log Prefix Convention
All diagnostic logs must use the unified structured logger (`log.<level>`) which automatically emits the prefix `[WK]`.

The `hardcoded-ui-string` rule treats strings starting with `[WK]` (inside structured logger calls) as developer diagnostics. Use the logger instead of raw `console.*` or custom prefixes:

```ts
log.debug('[WK] cache miss for subject batch', meta)
log.warn('[WK] retrying connection after backoff')
log.debug('[WK] timing probe', duration)
```

If a string after `[WK]` becomes user-visible UI copy, remove the diagnostic form and localize it instead.

## Maintenance Checklist
- Before merging: run lint; ensure no `local-i18n/*` violations.
- When adding styling/animation literals that get flagged: prefer adding a precise ignore regex rather than disabling the rule inline.
- Periodically review `messages.json` for unused keys and dev-only entries—cleanup is safe if not referenced in code.
   - Run `npm run i18n:unused` to list keys in `messages.json` that have no `t('key')` usage. Exit code is 1 if unused keys exist (use `--allow-exit-zero` to suppress failure for informational runs; supports `--json`).
   - Dev-only keys should generally not exist now that prefixes are used; prune any that slip in.

## Pre-commit Hook Recommendation

To prevent regressions, run localization lint + key sync on staged files:

1. Install tooling:
```
pnpm add -D husky lint-staged
```
2. Add to `package.json`:
```jsonc
"scripts": {
   // ...existing
   "prepare": "husky install",
   "lint:staged": "lint-staged"
},
"lint-staged": {
   "src/**/*.{ts,tsx}": ["eslint --max-warnings=0"],
   "locales/en/messages.json": ["node scripts/generate-message-keys.cjs --check"]
}
```
3. Create `.husky/pre-commit`:
```
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"
pnpm lint:staged
```

Fallback (no husky): place a `.git/hooks/pre-commit` with the same pnpm command and make it executable.

If a false positive occurs:
1. Confirm the string is truly non user-visible; if so ensure it uses `[WK]` via the logger or convert it to a sentinel token.
2. If still necessary, add a targeted allowlist addition in rule options (avoid broad disabling). Inline `eslint-disable-next-line local-i18n/hardcoded-ui-string` only with a justification comment.
- Keep heuristics stable; batch pattern additions to reduce churn.

## Removing/Pruning Keys
If a localized key becomes obsolete:
1. Remove the key from `messages.json`.
2. Update any generated key definition file.
3. Ensure no `t('key')` usages remain (TypeScript and ESLint will catch breakage).

## Sentinel Internal Tokens (`__WK_` Prefix)

To sharply reduce false positives while keeping heuristics strict, all purely technical, non user‑visible string literals are centralized as exported constants in `src/internal/tokens.ts` and share the `__WK_` prefix. Examples include:

- Event / runtime message types (e.g., `__WK_EVT_STATE`)
- Port / alarm names
- Mutation observer data attributes & class names
- Internal CSS class tokens for replacement spans or tooltips

### Why a Prefix?
The `hardcoded-ui-string` rule now accepts the `sentinelPrefix` option (configured as `__WK_`). Any literal starting with this prefix is ignored automatically. This eliminates the need to continually expand regex ignore patterns for structural tokens, while making such tokens:

1. Syntax-highlighted & discoverable at their definition site.
2. Searchable by prefix to audit all internal technical strings.
3. Easy to differentiate from user-facing copy during reviews.

### Adding a New Internal Token
1. Open `src/internal/tokens.ts`.
2. Add a constant using UPPER_SNAKE naming and the `__WK_` prefix:
   ```ts
   export const __WK_EVT_EXAMPLE = 'wanikanify:example'
   ```
3. Replace raw occurrences in the code with the constant.
4. Run `pnpm lint` to confirm it is not flagged.

If the token is ever promoted to user-visible UI (e.g., appears in rendered text), remove the sentinel constant usage and localize instead.

### Heuristic Integrity Notes
Technical literals (e.g., CSS tokens, transform chains, internal channel names) are ignored through narrowly scoped regex patterns or sentinel tokens. Periodically audit patterns for overly broad matches.

### Anti-Patterns
- DO NOT wrap user-facing sentences in sentinel constants to “bypass” localization.
- Avoid overloading a single sentinel constant with multiple semantic roles; keep them granular.

### Auditing
To list all internal tokens quickly:
```
grep -R "__WK_" src/
```
Verify each still represents non user‑visible technical context.

## Internal Token Enforcement Rule

To prevent drift back to ad‑hoc scattered technical literals, the custom rule `local-i18n/no-unregistered-internal-token` enforces that any string
matching the internal token patterns is ONLY declared in the canonical registry file:

Patterns enforced:
* `wanikanify:[a-z0-9_-]+` (message channels, alarms, storage keys, ports, diagnostics)
* `wanikanify-[a-z0-9_-]+` (internal CSS classes)

If such a literal appears directly in any other file, ESLint errors with:
> Internal token "wanikanify:xyz" must be declared in src/internal/tokens.ts and referenced via exported constant.

### Workflow When Adding a New Internal Token
1. Edit `src/internal/tokens.ts` and add a suitably named `__WK_` constant with the literal value.
2. Replace the raw literal everywhere else with the constant (or destructure from the exported `__WK` aggregate if preferred).
3. Run `pnpm lint` – the enforcement rule should now pass.

### Why This Matters
Centralization:
* Simplifies auditing & refactors (e.g., renaming a channel or class once).
* Keeps the ignore heuristics for `hardcoded-ui-string` lean (few regex patterns; rely on sentinel prefix instead).
* Prevents “entropy” where new contributors cargo‑cult raw literals.

### Opting Out (Discouraged)
If a legitimate need arises for a one-off string that matches the pattern but should not be centralized (extremely rare), prefer to still add it to
`tokens.ts`. Inline disabling `// eslint-disable-next-line local-i18n/no-unregistered-internal-token` requires a justification comment and should be
treated as technical debt.

### Configuration
The rule supports optional overrides:
```js
'local-i18n/no-unregistered-internal-token': ['error', {
   // tokenFilePattern: 'src/internal/tokens\\.ts$',
   // prefixPattern: '^(wanikanify:|wanikanify-)[a-z0-9_-]+$'
}]
```
Defaults are sufficient for the current project structure.

---
## Logging Standard

All developer diagnostics use a unified structured logger exported from `src/utils/log.ts`.

Format: `[WK] [LEVEL] message ...context`

Examples:
```ts
log.debug('refresh started', jobId)
log.info('extension installed')
log.warn('storage usage at %', usage.percentage)
log.error('failed to sync settings', error)
```

Rationale:
* Eliminates ad-hoc `WaniKanify:` prefixes and inconsistent casing.
* Simplifies ESLint exclusion (the hardcoded string rule treats `[WK]` as a dev log prefix).
* Enables easy console filtering (search `[WK] [ERROR]`).

Guidelines:
* Keep messages terse; avoid sentence punctuation unless clarifying.
* Prefer additional structured arguments over string interpolation for objects/metrics.
* Do not introduce alternate prefixes (stick strictly to `[WK]`).
* Never log user-facing sentences—localize those instead.

Do not introduce alternate manual prefixes (e.g., `WaniKanify:`); always route diagnostics through the logger.

### Prohibition of Raw `console.*`

Direct `console.*` calls in application source are now disallowed by the ESLint rule `local-i18n/no-raw-console`.

Motivation:
* Ensures every log line is consistently formatted and easily filterable.
* Prevents accidental introduction of user-facing sentences outside the localization pipeline.
* Centralizes future enhancements (e.g., log shipping, redaction) in one implementation.

Allowed contexts (by default configuration):
* The logger implementation file `src/utils/log.ts`.
* Test files (`**/*.test.ts(x)` and anything under `__tests__/`).
* Scripts in `/scripts/` used for build / maintenance.

If you need to log in a disallowed file, import and use:
```ts
import { log } from '~src/utils/log'
log.info('cache primed', meta)
```

To intentionally allow a specific non-application path, extend the rule's `allowPattern` array in `eslint.config.cjs`.

Avoid inline disables. If absolutely necessary (e.g., quick debugging during an experiment), remove before committing. Persistent inline disables require a justification comment and are considered technical debt.

