## Description
WaniKanify ReZero is the successor to the deprecated WaniKanify 2.0 extension, rebuilt to run smoothly on Firefox. It pulls vocabulary from your WaniKani account, merges custom or imported entries, and replaces English text on the fly while respecting the SRS stage filters you choose.

### Features
- Syncs with the WaniKani API (read scope) and caches results for quick reuse.
- Uses an Aho-Corasick matcher to stream replacements without freezing pages.
- Displays furigana tooltips, optional audio playback, and number replacement.
- Supports custom vocabulary, blacklist entries, and published Google Sheets imports with history.
- Provides allow and block lists, per-site overrides, and an instant toolbar toggle.
- Offers settings backup/restore, reset to defaults, and an opt-in telemetry toggle for local diagnostics.

### Permissions and privacy
Data stays on your device. Permissions requested: storage for settings and caches; activeTab so the toolbar button can toggle replacements on the current page. All network calls go directly to the official WaniKani API using your token.

### Support
Read the docs, open issues, or contribute on GitHub: https://github.com/5160d/WaniKanify-ReZero
