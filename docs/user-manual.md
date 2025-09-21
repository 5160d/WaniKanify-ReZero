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

## Spreadsheet import
1. Publish your Google Sheet to the web.
2. Add the sheet ID, tab name, and column headers in the import table.
3. Press "Import" to fetch vocabulary. Progress and warnings appear inline; history records can be restored or deleted later.

## Audio playback
- Enable audio in the Behavior tab and choose click or hover playback.
- Playback respects per-site overrides and the audio volume slider.

## Support
If you encounter issues, consult `docs/troubleshooting.md` or open the browser console to review logs from the background worker and content script.
