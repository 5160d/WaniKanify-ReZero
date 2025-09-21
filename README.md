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

1. **Create production build**
   ```bash
   pnpm build
   # or
   npm run build
   ```

2. **Package for distribution**
   ```bash
   pnpm package
   # or
   npm run package
   ```

The production files will be generated in the `build/` directory, ready for browser store submission.

### Generating Marketing Assets

Generate professional screenshots and promotional images for store listings:

```bash
# Quick generation (PowerShell)
.\scripts\generate-assets.ps1

# Or run manually
npx playwright test tests/e2e/assets/generate-assets.spec.ts
```

This creates:
- **Screenshots**: Options page, popup, spreadsheet import, live replacement demo
- **Hero Images**: Chrome Web Store (1400x560) and Microsoft Edge (3000x2000) promotional images
- **Output**: All assets saved to `release-assets/assets/`

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

