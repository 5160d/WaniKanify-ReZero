# API Documentation

This overview summarises the main service entry points available inside the extension.

- WaniKani API client: see src/services/wanikani.ts for authentication, caching, and helpers.
- Vocabulary manager: src/services/vocabulary.ts merges custom/imported/WaniKani data and exposes lookup utilities.
- Text replacement engine: 
	- src/services/fastAhoCorasickReplacer.ts provides high-performance replacement using Aho-Corasick algorithm for both light and heavy pages, supporting batch processing and time-sliced processing modes.
	- The engine performs synchronous first compile for immediate availability, then incremental recompiles on updates.
- Site filter: src/services/siteFilter.ts controls run conditions and site overrides.
- Spreadsheet import: src/services/spreadsheetImport.ts handles CSV downloads, validation, caching, and history.
- Storage service: src/services/storage.ts wraps @plasmohq/storage with compression, migrations, and quota helpers.
- Audio playback: src/services/audio.ts provides click / hover playback with caching and TTS fallback.
	- Public methods: `updateSettings`, `setVocabulary`, `handleClick/handleHover` (internally bound), `stop`, `dispose` (removes event listeners for deterministic teardown in tests and React unmounts).

Refer to docs/architecture.md for a deeper architectural view of how these services interact.
