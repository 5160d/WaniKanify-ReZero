# WaniKanify ReZero

A browser extension tool to reinforce your [WaniKani](https://wanikani.com) vocabulary by replacing English text on web pages with Japanese vocabulary. This is the successor to the now deprecated WaniKanify 2.0.

## Overview

WaniKanify ReZero helps you practice Japanese vocabulary in context by automatically replacing English words with their Japanese equivalents while browsing the web. The extension integrates with your WaniKani account to use your learned vocabulary and supports SRS (Spaced Repetition System) level filtering.

## Features

### Core Functionality
- **Text Replacement**: Automatically replaces English words with Japanese vocabulary on web pages
- **WaniKani Integration**: Connects to your WaniKani account via API token to access your vocabulary
- **SRS Level Filtering**: Choose which SRS levels to include (Apprentice, Guru, Master, Enlightened, Burned)
- **Audio Support**: Pronunciation audio for Japanese vocabulary (when available)

### Vocabulary Management
- **Custom Vocabulary**: Add your own English-to-Japanese word mappings
  - Format: `english1,english2:japanese:reading`
  - Example: `cat,feline:猫:ねこ`
- **Vocabulary Blacklist**: Exclude specific English words from replacement
- **Spreadsheet Import**: Import vocabulary from external spreadsheets
- **Numbers Replacement**: Option to replace numbers with Japanese numerals

### Customization Options
- **Site Filtering**: Control which websites the extension runs on
- **Auto-run Toggle**: Enable/disable automatic text replacement
- **Audio Settings**: Configure pronunciation playback options
- **Dark/Light Theme**: Automatic theme switching based on system preferences

## Installation & Setup

### Prerequisites
- Node.js (recommended: latest LTS version)
- pnpm or npm package manager
- A [WaniKani](https://wanikani.com) account and API token

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/5160d/WaniKanify-ReZero.git
   cd WaniKanify-ReZero
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. **Load the extension in your browser**
   - Chrome: Load the `build/chrome-mv3-dev` directory in Developer Mode
   - Firefox: Load the `build/firefox-mv3-dev` directory
   - Edge: Load the `build/chrome-mv3-dev` directory in Developer Mode

### Building for Production

Recommended (multi-browser, zipped artifacts in one step):

1. Run the cross-browser build & package pipeline (Chrome + Firefox MV3):
   ```bash
   pnpm build:all
   # or
   npm run build:all
   ```
   This performs:
   - `plasmo build --target=chrome-mv3,firefox-mv3` (generates optimized prod directories)
   - `plasmo package` (creates zip archives alongside the build folders)

2. Inspect output in `build/`:
   - `build/chrome-mv3-prod/` (unpacked Chrome/Edge submission folder)
   - `build/firefox-mv3-prod/` (unpacked Firefox submission folder)
   - `build/chrome-mv3-prod.zip`
   - `build/firefox-mv3-prod.zip`

3. (Optional) Run the test suite before submitting:
   ```bash
   pnpm test
   ```

Single‑target (advanced / custom):
```bash
# Build only (outputs unpacked chrome-mv3-prod directory)
pnpm build

# Then optionally package just that target
pnpm package
```
Artifacts for additional targets can be produced by adding them to the `--target` list (see Plasmo docs) or by re-running `plasmo build` with a different target set, then invoking `plasmo package` again.

Submission Notes:
- Chrome Web Store & Edge Add-ons: upload `chrome-mv3-prod.zip`.
- Firefox Add-ons: upload `firefox-mv3-prod.zip` (contains `browser_specific_settings.gecko` with id + `strict_min_version`).
- If you modify manifest permissions or icons, re-run `pnpm build:all` to regenerate both zips.

All production bundles are tree‑shaken and minified by Plasmo. No manual manifest editing is required for standard updates.

### Generating Marketing Assets

Generate screenshots and promotional images for store listings:

```bash
# Quick generation (PowerShell)
.\scripts\generate-assets.ps1

# Or run manually
npx playwright test tests/e2e/assets/generate-assets.spec.ts
```

This creates:
- **Screenshots**: Options page, popup, spreadsheet import, live replacement demo
- **Hero Images**: Chrome Web Store (1400x560) and Microsoft Edge (3000x2000) promotional images
- **Promotional tiles**: promotional tile for Edge.

All files are written under `release-assets/assets/`. See the Asset Generation Guide at `tests/e2e/assets/README.md` for details and customization tips.

See [Asset Generation Guide](tests/e2e/assets/README.md) for detailed documentation.

## Configuration

1. **Get your WaniKani API Token**
   - Visit [WaniKani API Settings](https://www.wanikani.com/settings/personal_access_tokens)
   - Generate a new token with read permissions

2. **Configure the extension**
   - Click the extension icon and go to Settings
   - Enter your WaniKani API token
   - Configure your preferred SRS levels and other options

## Project Structure

This is a [Plasmo](https://docs.plasmo.com/) extension project with the following key components:

- `src/options.tsx` - Main settings/options page
- `src/popup.tsx` - Extension popup interface
- `src/components/settings/` - Settings components and logic
- `src/styles/` - Theme and styling configuration
- `package.json` - Project dependencies and build scripts

### Additional documentation

- `docs/api.md` – quick reference for the core service APIs.
- `docs/architecture.md` – overview of runtime components and data flow.
- `docs/developer-setup.md` – environment setup, build, and test instructions.
- `docs/troubleshooting.md` – common issues and resolution steps.
- `docs/user-manual.md` – end-user guide with feature walkthroughs.
- `docs/store-listing.md` – draft Chrome Web Store listing copy.
- `docs/privacy-policy.md` – privacy policy draft for store submission.
- `docs/localization.md` – i18n workflow, adding locales, and message key hygiene.
- `docs/cross-browser-report.md` – feature parity and validation notes across Chrome/Firefox/Edge.

### Testing (Unit vs Live API)

The default Jest test suite uses mocked network requests and does NOT contact the real WaniKani API.

Optional live API smoke/incremental tests are provided under `__tests__/services/*live*.test.ts`. These are disabled by default and only run when you explicitly opt in.

Run them sparingly – they make real HTTPS requests to the official WaniKani API and therefore:
* Count against your personal rate limits (the client spaces requests but repeated runs still add up)
* Depend on your account's data (subjects, assignments) and may have variable timing
* Are slower (network + pagination)

Enable live tests by setting two environment variables:

PowerShell (Windows):
```powershell
$env:WK_LIVE = '1'; $env:WANIKANI_API_TOKEN = '<your-token>'; npm test -- -- wanikani.live.test.ts
```

Unix shells:
```bash
WK_LIVE=1 WANIKANI_API_TOKEN=<your-token> npm test -- wanikani.live.test.ts
```

Available live test files:
* `wanikani.live.test.ts` – basic subjects + assignments smoke
* `wanikani.incremental.live.test.ts` – incremental `updated_after` behavior and diagnostics
* `background.live.test.ts` – simplified end‑to‑end vocabulary refresh simulation

You can pass multiple file names after `--` to run more than one. Avoid running the full live suite repeatedly; once per development session is usually sufficient.

To silence a noisy (non-fatal) React Testing Library deprecation warning about `ReactDOMTestUtils.act`, you may set:

```powershell
$env:SUPPRESS_ACT_WARNING='1'; npm test
```

### Environment Variables

| Variable | Purpose | Default Behavior |
|----------|---------|------------------|
| `WK_LIVE` | When set to `1`, enables live WaniKani API tests. | Disabled (tests skipped) |
| `WANIKANI_API_TOKEN` | Personal access token used by live tests and (optionally) manual scripts. | Not required for unit tests |
| `SUPPRESS_ACT_WARNING` | When `1`, suppresses deprecated `ReactDOMTestUtils.act` console warnings during tests. | Warnings shown |

Never commit your WaniKani API token. Prefer setting it in a temporary shell session or using a local `.env` file excluded by `.gitignore` (if added).

## Technology Stack

- **Framework**: [Plasmo](https://docs.plasmo.com/) - Modern browser extension framework
- **UI Library**: React with Material-UI (MUI) components
- **Language**: TypeScript
- **Styling**: Custom theme system with dark/light mode support, Tailwind CSS
- **Storage**: Chrome Extension Storage API with sync support

## Contributing

This project is a continuation of the WaniKanify concept. Contributions are welcome! Please see the [GitHub repository](https://github.com/5160d/WaniKanify-ReZero) for more information.

## License

GPL-3.0 License - see the project repository for full license details.

## Acknowledgments

- Successor to the original WaniKanify 2.0 project
- Built for the [WaniKani](https://wanikani.com) community
- Uses the WaniKani API for vocabulary integration

