## Overview
WaniKanify ReZero is the modern rebuild of the now retired WaniKanify 2.0 extension. It connects to your WaniKani account, applies the vocabulary you have unlocked, and swaps English words on the web with the Japanese terms you want to reinforce. The Manifest V3 architecture, idle batching, and new Aho-Corasick matcher keep replacements fast and responsive.

## Key features
- WaniKani sync: enter a personal access token with read scope and filter by SRS stage.
- Smarter replacements: streaming multi-pattern matching, tooltip readings, undo support, and optional Japanese number conversion.
- Vocabulary management: import published Google Sheets, merge custom entries, maintain blacklists, and review import history.
- Site control: manage allow and block lists, temporary excludes, and per-site overrides for audio or auto-run.
- Audio playback: click, hover, or automatic pronunciation using cached API audio with a TTS fallback.
- Developer tools: export or back up settings, reset to defaults, and opt into telemetry to inspect performance locally.

## Privacy
The extension stores your API token, settings, and cached vocabulary locally via browser storage. Requests go only to the official WaniKani API using your token. Permissions requested: storage for configuration and cache, activeTab so the toolbar icon can toggle replacements on the current page.

## Getting started
1. Install the extension.
2. Open the options page and paste your WaniKani API token (read scope).
3. Choose the SRS levels and behaviour that suit your study flow.
4. Click "Refresh vocabulary" and start browsing.

Support, documentation, and issue tracking are available on GitHub: https://github.com/5160d/WaniKanify-ReZero
