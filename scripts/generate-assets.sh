#!/bin/bash

# Asset Generation Script for WaniKanify Extension
# This script generates all marketing and promotional assets

echo "🎨 WaniKanify Asset Generator"
echo "=============================="
echo ""

# Check if extension is built
if [ ! -d "build/chrome-mv3-dev" ]; then
    echo "❌ Extension not built. Please run 'npm run dev' first."
    exit 1
fi

# Check if required directories exist
if [ ! -d "release-assets/assets/screenshots" ]; then
    echo "📁 Creating release-assets directories..."
    mkdir -p release-assets/assets/screenshots
    mkdir -p release-assets/assets/hero
fi

echo "🚀 Generating all extension assets..."
echo ""

# Generate all assets
npx playwright test tests/e2e/assets/generate-assets.spec.ts --project=chromium

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Asset generation completed successfully!"
    echo ""
    echo "📸 Generated Screenshots:"
    echo "  - options-overview.png"
    echo "  - popup-token.png"
    echo "  - spreadsheet-import.png"
    echo "  - live-replacement.png"
    echo ""
    echo "🎨 Generated Hero Images:"
    echo "  - hero-1400x560.png (Chrome Web Store)"
    echo "  - hero-3000x2000.png (Microsoft Edge)"
    echo ""
    echo "📁 All assets saved to: release-assets/assets/"
else
    echo ""
    echo "❌ Asset generation failed. Check the logs above for errors."
    exit 1
fi