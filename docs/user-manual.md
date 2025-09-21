# User Manual

## Getting started
1. Install the unpacked extension (`build/chrome-mv3-dev`) in your Chromium-based browser.
2. Click the toolbar icon to open the popup and enter your WaniKani API token to enable synchronisation. Once a token is saved, clicking the icon toggles replacements on the current tab without reopening the popup.

## Options overview
- **General**: Manage your API token, clear cached vocabulary, and backup/restore settings.
- **Behavior**: Toggle auto-run, configure audio mode and volume, manage tooltips, adjust site filters, and preview changes live.
- **Vocabulary**: Configure number replacement, SRS groups, custom vocabulary, blacklist entries, and spreadsheet imports.
- **Debug**: Toggle performance telemetry logging when you need timing details for troubleshooting.
- **Tools**: Import/export settings, create backups, reset to defaults, and pull settings from synced storage.

### Live Preview
The Live Preview section renders representative sample sentences and applies your current settings instantly:

- Vocabulary replacements update immediately after you change custom vocabulary, blacklist entries, or enable number replacement.
- Number replacement (e.g. 123 → Japanese numerals) is shown.
- Tooltips appear/disappear as you toggle the setting (no page reload required).
- Audio settings (enable/disable, click vs hover, volume) are respected. Clicking (or hovering, if configured) a replacement in the preview will trigger audio or TTS just like a real page.

This preview does not require a saved API token—custom vocabulary and numbers still demonstrate behaviour locally. Once a token is saved and a full sync occurs, additional WaniKani vocabulary will appear during real browsing sessions, but the preview intentionally uses a small static sample for clarity.

## Spreadsheet import
1. Publish your Google Sheet to the web.
2. Add the sheet ID, tab name, and column headers in the import table.
3. Press "Import" to fetch vocabulary. Progress and warnings appear inline; history records can be restored or deleted later.

## Audio playback
- Enable audio in the Behavior tab and choose click or hover playback.
- Playback respects per-site overrides and the audio volume slider.
- If no recorded audio is available for a term, a text‑to‑speech (TTS) fallback is attempted using the browser's speech synthesis voices.
- The options page Live Preview uses the exact same AudioService; disabling audio there guarantees no event listeners remain active (they are disposed on unmount).

## Support
If you encounter issues, consult `docs/troubleshooting.md` or open the browser console to review logs from the background worker and content script.
