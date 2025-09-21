# Asset Generation Scripts

This directory contains scripts to automatically generate all marketing and store assets for the WaniKanify extension.

## Overview

The asset generator creates screenshots and promotional images by:
- Loading the actual extension in a browser
- Navigating to different pages and features
- Capturing screenshots with proper highlighting and sample data
- Generating hero images with the extension's actual logo

## Generated Assets

### Screenshots (`release-assets/assets/screenshots/`)
- **options-overview.png** - Main extension settings page overview
- **popup-token.png** - Extension popup showing token entry interface
- **spreadsheet-import.png** - Focused view of spreadsheet import functionality
- **live-replacement.png** - Demonstration of Japanese text replacements in action

### Hero Images (`release-assets/assets/hero/`)
- **hero-1400x560.png** - Chrome Web Store promotional image
- **hero-3000x2000.png** - Microsoft Edge Add-ons store promotional image

## Prerequisites

1. **Built Extension**: The extension must be built for development first:
   ```bash
   npm run dev
   ```

2. **Playwright**: Ensure Playwright is installed with Chromium:
   ```bash
   npx playwright install chromium
   ```

## Usage

### Generate All Assets
Run the complete asset generation suite:
```bash
# From project root
npx playwright test tests/e2e/assets/generate-assets.spec.ts
```

### Generate Specific Assets
Run individual asset generation tests:
```bash
# Options page screenshot only
npx playwright test tests/e2e/assets/generate-assets.spec.ts -g "options overview"

# Popup screenshot only  
npx playwright test tests/e2e/assets/generate-assets.spec.ts -g "popup"

# Spreadsheet import screenshot only
npx playwright test tests/e2e/assets/generate-assets.spec.ts -g "spreadsheet import"

# Live replacement demo only
npx playwright test tests/e2e/assets/generate-assets.spec.ts -g "live replacement"

# Hero images only
npx playwright test tests/e2e/assets/generate-assets.spec.ts -g "hero"
```

## Features

### Smart Popup Sizing
The popup screenshot automatically detects the actual content dimensions to:
- Avoid truncation on the right side
- Eliminate excessive blank space at the bottom
- Maintain proper aspect ratio for store listings

### Spreadsheet Import Focus
The spreadsheet import screenshot:
- Navigates to the correct "Vocabulary" section
- Highlights the "Imported Vocabulary" table with colored borders
- Fills sample data into input fields for demonstration
- Shows the help icon and functionality clearly

### Realistic Demonstrations
- Uses actual extension functionality where possible
- Includes sample Japanese vocabulary and replacements
- Shows real UI states and interactions
- Applies visual highlighting to draw attention to key features

## Customization

### Modifying Sample Data
Edit the sample data in `generate-assets.spec.ts`:

```typescript
// Spreadsheet import sample data
const sampleData = [
  '1lIo2calXb_GtaQCKLr989-Ma_hxXlxFsHE0egko-D9k', // Collection Key
  'Core 6K Part 1', // Sheet Name  
  'English', // English Column
  'Japanese', // Japanese Column
  'Reading', // Reading Column
  ',' // Delimiter
]

// Live replacement vocabulary
const demoVocab = `cat,猫,ねこ
dog,犬,いぬ
house,家,いえ
...`
```

### Adjusting Dimensions
Modify viewport sizes for different aspect ratios:

```typescript
// For different screenshot sizes
await page.setViewportSize({ width: 1280, height: 800 })

// For hero images
await page.setViewportSize({ width: 1400, height: 560 }) // Chrome Web Store
await page.setViewportSize({ width: 3000, height: 2000 }) // Microsoft Edge
```

## Troubleshooting

### Extension Not Loading
If the extension doesn't load properly:
1. Ensure the extension is built: `npm run dev`
2. Check that `build/chrome-mv3-dev/` exists and contains `manifest.json`
3. Verify no TypeScript compilation errors

### Screenshots Are Blank
If screenshots appear blank:
1. Check browser console for JavaScript errors
2. Increase wait times: `await page.waitForTimeout(3000)`
3. Ensure extension permissions are granted

### Assets Not Generated
If no files are created:
1. Verify the `release-assets/assets/` directory structure exists
2. Check file permissions for the output directories
3. Run with `--headed` flag to see what's happening: `--headed`

## Store Submission

The generated assets are optimized for:

### Chrome Web Store
- Hero image: 1400x560px (required)
- Screenshots: 1280x800px (recommended)

### Microsoft Edge Add-ons
- Hero image: 3000x2000px (recommended)
- Screenshots: 1366x768px (acceptable)

### Firefox Add-ons (AMO)
- Screenshots: 1280x800px (recommended)
- No hero image required

## Maintenance

### When to Regenerate
Regenerate assets when:
- UI/UX changes are made to the extension
- New features are added that should be showcased
- Store submission requirements change
- Brand colors or logos are updated