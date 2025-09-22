# Localization Migration Plan (English-only baseline to extensible i18n)

This document outlines the tasks required to migrate the WaniKanify ReZero extension from hardcoded English strings to a structured, maintainable localization system using Plasmo's `_locales` support and message extraction patterns.

## Guiding Principles
- Single source of truth: All user-facing strings live in `_locales/<lang>/messages.json` (or modularly split then merged at build time if needed).
- Message keys are semantic (e.g. `settings_audio_volume_label`) not presentation-based (`label3`).
- No runtime string concatenation that breaks translatability; prefer interpolation placeholders.
- Avoid embedding HTML in messages unless absolutely required; use React structure + placeholder tokens.
- Support pluralization-ready patterns (anticipate counts).
- Preserve accessibility: aria-labels, titles, alt text also localized.
- Ensure default locale (`en`) always up to date; fallback to `en` for missing keys.

## High-Level Phases
1. Audit & Inventory
2. Introduce i18n infrastructure
3. Extract and replace strings incrementally
4. Add developer ergonomics & linting
5. Testing & QA (unit + manual)
6. Optional: Future additional locale onboarding workflow

## Phase 1: Audit & Inventory
Tasks:
- [x] Enumerate all UI surfaces:
  - `options.tsx` (settings form labels, section headers, buttons, tooltips) ✅
  - `popup.tsx` (token input, status text, buttons) ✅
  - `content.ts` (no user-facing literal strings requiring localization discovered beyond injected vocab) ✅ (scanned)
  - Components under `src/components/**` (forms, preview, vocabulary lists, blacklist, custom vocabulary, import workflow, tools) ✅
  - Error or status strings in `background.ts` that may propagate to UI (`wanikanify:error` responses) ✅ (generic network error captured)
- [x] Produce a JSON inventory (`i18n-inventory.json`) mapping fileRefs, default messages, domains, descriptions.
- [x] Classify messages by domain: `settings`, `popup`, `import`, `audio`, `preview`, `tools`, `blacklist`, `sitesFiltering`, `options`, `errors`.
- [x] Identify dynamic strings needing interpolation (placeholders added):
  - Import success & warnings ($ENTRY_COUNT$, $WARNING_COUNT$)
  - Blacklist count ($USED$, $MAX$)
  - Backup restore ($BACKUP_NAME$)
  - History restored/removed ($SHEET_NAME$)
- [x] Identify concatenations → Represented via template + fragment pattern (import warnings fragment). No remaining unsafe runtime concatenations flagged for extraction phase.

Deliverable: `i18n-inventory.json` (complete initial set; further additions occur opportunistically during extraction).

Notes:
- Some duplicate semantic concepts intentionally have separate keys (e.g. `settings_autorun_label` vs `toggle_autorun_label`) pending consolidation decision in Phase 2.
- Next: Implement infrastructure (`t()`), generate types, and begin Batch 1 replacements.

## Phase 2: Infrastructure
Tasks:
 - [x] Create `_locales/en/messages.json` (expanded with full inventory; added new keys for tooltips + save statuses) — superseded by migration to `locales/en/messages.json` as authoritative source (legacy retained temporarily only for historical context)
 - [x] Add lightweight i18n utility `src/utils/i18n.ts` with `t()` + substitution + dev missing-key warning.
 - [x] Static JSON import working; adjusted path from alias to relative due to Plasmo root `_locales` expectation.
 - [x] Generated key union (`src/locales/message-keys.d.ts`) for type safety (manually authored this phase; future script optional).
 - [x] Manifest fields now localized: `name`, `description`, `short_name`, `action.default_title` use `__MSG_...__` tokens.
 - [x] Added unit test `__tests__/utils/i18n.test.ts` (basic behavior) and coverage test `__tests__/utils/i18n.keys.coverage.test.ts` ensuring all keys resolve.
 - [x] Build verified after import path correction.

Notes:
 - Initial attempt used `~_locales/...` alias which resolved to `src/_locales`; corrected to relative `../../_locales/...` because Plasmo copies locale directory at project root only.
 - Duplicate keys intentionally preserved pending consolidation (e.g., `settings_autorun_label` vs `toggle_autorun_label`).
 - Future improvement: automate type generation & add lint guard (Phase 4).

## Phase 3: Extraction & Replacement (COMPLETED)
Incremental strategy executed in batches to minimize regression risk. All targeted user-facing literals now resolved to `t()` lookups.

Batch 1 (Core UI):
- [x] Localized `popup.tsx` & `options.tsx` headings, inputs, buttons, status labels.
- [x] Added/annotated keys with translator-friendly `description` fields.

Batch 2 (Settings Components):
- [x] Toggles (autorun, tooltips, numbers, performance, audio) fully localized (labels + multi-line tooltips).
- [x] Text areas: Custom Vocabulary + Blacklist (headings, placeholders, tooltips, count templates, notes).
- [x] Preview component (heading + description) localized.

Batch 3 (Runtime & Background):
- [x] User-surfacing background / service error strings mapped (generic audio failure, generic network error). Internal console diagnostics intentionally left in English.

Batch 4 (Import & Advanced):
- [x] Spreadsheet import table (column headers, action buttons, import state machine strings, success/warning templates, tooltips, history list & snackbars).
- [x] Dynamic template fragments for success + warnings, restore/remove history, count placeholders.

Batch 5 (Edge / Tools / Sites):
- [x] Settings Tools (export/import/backup/reset/sync + confirmations + snackbars).
- [x] Sites Filtering table (heading, tooltip structured content, input placeholder, add/delete aria, pattern examples).

Dynamic Placeholder Coverage:
- Import success: `$ENTRY_COUNT$`, warnings fragment `$WARNING_COUNT$`.
- History entry templates: `$SHEET_NAME$`, `$COLLECTION_KEY$`, `$ENTRY_COUNT$`, `$DATE$`.
- Blacklist count & errors: `$USED$`, `$MAX$`.
- Backup restore / deletion: `$BACKUP_NAME$`.

Supporting Artifacts:
- [x] Added `LocalizationSmoke.test.tsx` to assert presence of localized values & absence of raw key identifiers.
- [x] Updated `message-keys.d.ts` multiple times to align with catalog growth (manual update—automation deferred to Phase 4).

Deferred / Not in Phase 3 Scope:
- Key deduplication (e.g. overlapping audio/autorun labels) – tagged for Phase 4 cleanup.
- Automated type generation script.
- Lint rule preventing hard-coded English reintroduction.
- Multi-locale loading & negotiation.

Result: Phase 3 acceptance criteria (no hard-coded user-facing strings across targeted surfaces, all dynamic templates localized, tests guarding coverage) met.

## Phase 4: Developer Ergonomics & Quality Gates (COMPLETED)
Implemented:
- [x] Automated key union generator: `scripts/generate-message-keys.cjs` + npm scripts `i18n:gen` and `i18n:check`.
- [x] Jest sync test `i18n.messageKeysSync.test.ts` ensuring `message-keys.d.ts` matches `locales/en/messages.json` (previously `_locales/en/messages.json`).
- [x] Hardcoded string guard test `i18n.hardcodedLiterals.test.ts` (heuristic allowlist for internal logs, sample preview content, CSS tokens).

Remaining / Planned Enhancements (moved to Deferred section):
- Tighten hardcoded string guard (differentiate console/log-only vs. surfaced UI by simple pattern around `console.` usage lines).
- Optional pre-commit git hook invoking `npm run i18n:check` + hardcoded guard + duplicate check on staged file diff only.
- Consider converting guard test + duplicate detection to ESLint custom rules for immediate editor feedback.
- Silence React `act()` warnings in tests (wrap async update areas) to keep CI noise low.

Implemented Post-Phase Addendum:
- Duplicate message value detection script (`scripts/check-duplicate-messages.cjs`) + Jest test `i18n.duplicateMessages.test.ts` with allowlist for intentional short/common labels.

### ESLint Conversion (Post Phase 4 Enhancement - COMPLETED)
To provide earlier (editor-time) feedback rather than relying solely on Jest heuristics, two custom ESLint rules were added via a local plugin `eslint-plugin-local-i18n`:

Rules:
- `local-i18n/hardcoded-ui-string`: Heuristically flags string literals in `src/` that look like end-user visible English and are not in an allowlist and not already passed to `t()`. This replaces the reliance on the Jest hardcoded literals guard for day-to-day development (the test may remain temporarily as a safety net or can be removed once confidence is high).
- `local-i18n/duplicate-message-values`: Loads `locales/en/messages.json` once per lint run and reports any duplicate `message` values not in the duplicate allowlist (mirrors the standalone script + Jest test logic).

Implementation Details:
- Plugin location: `eslint-plugin-local-i18n/` with rule modules under `rules/`.
- Configured in `.eslintrc.cjs` with synchronized allowlists (shared values such as `Save`, `Delete`, etc.).
- Added npm scripts: `lint` / `lint:fix` for CI & local usage.
- Future refinement: Add contextual awareness (e.g., ignore literals inside logging calls, or differentiate title/tooltips vs. data attributes) if false positives emerge.

Next potential cleanup:
- Remove or relax the Jest hardcoded literals test once ESLint rule proves stable.
- Integrate `pnpm lint` into a pre-commit hook (e.g., using Husky) alongside `i18n:check` and `i18n:dupes` script for staged files.
- Consider extracting shared allowlist constants to a single JSON to avoid drift across rule options, test, and script.

Deferred (Phase 5+ or optional):
- Multi-locale dynamic loading scaffold.
- Localization guidelines doc for translators.
- Key deduplication pass (merge semantic duplicates: e.g. `settings_autorun_label` / `toggle_autorun_label`).
- Pluralization utility abstraction if future languages require complex forms.

## Phase 5: Testing & QA
Tasks:
- [ ] Jest snapshot test for popup/options after localization (ensures string keys map correctly).
- [ ] Manual test in Chrome, Firefox, Edge: verify manifest name/description show localized values.
- [ ] Simulate missing key: temporarily remove one, ensure fallback (either key echoed or fallback English) is graceful.

## Phase 6: Future Additional Locale Support (Optional)
Preparation steps now to make later addition trivial:
- [ ] Document key naming conventions in `localization-guidelines.md`.
- [ ] Provide a script `scripts/extract-messages.ts` that outputs a template JSON for translators.
- [ ] Ensure pluralization strategy (consider integrating a micro i18n library later if complex forms appear).

## Key Naming Convention
Pattern: `<area>_<feature>_<element>[_qualifier]`
Examples:
- `settings_audio_volume_label`
- `popup_token_placeholder`
- `import_validation_missing_column`
- `error_network_generic`

## Risk Mitigation
| Risk | Mitigation |
|------|------------|
| Large invasive diff introduces regressions | Batch extraction, run tests each batch |
| Missing key at runtime | `t()` fallback returns key and dev console.warn |
| Translator confusion later | Provide `description` fields early |
| String reuse too aggressive | Prefer new key, then refactor duplicates knowingly |

## Minimal Initial Scope (to satisfy policy)
1. Add `default_locale` (DONE).
2. Provide messages.json with extension name/description (DONE).
3. Replace manifest-visible fields with `__MSG_...__` (PENDING adjustment via manifest override if not already handled by Plasmo build output).
4. Begin replacing UI hardcoded strings in popup/options (Batch 1).

## Acceptance Criteria for “Localization-Ready”
- No user-facing string literals remain in `popup.tsx` or `options.tsx` except those intentionally built from localized tokens.
- `messages.json` contains all Batch 1–4 keys.
- `t()` utility present with fallback + type safety.
- Lint/test guard prevents reintroduction of raw strings.

---
This plan focuses on minimal friction migration, enabling future additional languages while remaining English-only today.
