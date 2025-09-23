# Privacy Policy

WaniKanify ReZero does not collect or transmit personal data beyond what is required to access the WaniKani API on behalf of the user.

## Data collected
- WaniKani API token (stored locally using browser extension storage).
- User-provided vocabulary lists, settings, and spreadsheet configurations (stored locally and synchronised via browser sync if enabled).

## Data sharing
No data is transmitted to third-party servers by the extension. All requests go directly to the official WaniKani API using the user's token.

## Permissions
- `storage`: used to store extension settings, vocabulary cache, and import history.
- `activeTab`: used to send toggle messages to the current tab when you click the toolbar icon so replacements can pause or resume without opening the options page.
- `alarms`: used to schedule periodic background refreshes of the WaniKani vocabulary/cache so content stays up to date without manual action.
- `Host permissions (https://*/*)`: required so the extension can read and modify page content to replace vocabulary on the websites you visit. Processing happens locally in the browser; page text is not sent to any server. You can control scope by disabling Auto Run, running on-demand, or adding sites to the Filtered Websites list in Options.

## User control
- Settings can be exported or imported via the options page.
- Backups can be created or deleted locally.
- Cached vocabulary can be cleared from the options page via the Clear cache button.

If you uninstall the extension or clear its data through the browser's extension settings, all locally stored information is removed.
