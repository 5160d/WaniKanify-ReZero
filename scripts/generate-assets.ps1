# Asset Generation Script for WaniKanify Extension
# This PowerShell script generates all marketing and promotional assets

Write-Host "🎨 WaniKanify Asset Generator" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if extension is built
if (!(Test-Path "build/chrome-mv3-dev")) {
    Write-Host "❌ Extension not built. Please run 'npm run dev' first." -ForegroundColor Red
    exit 1
}

# Check if required directories exist
if (!(Test-Path "release-assets/assets/screenshots")) {
    Write-Host "📁 Creating release-assets directories..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path "release-assets/assets/screenshots" | Out-Null
    New-Item -ItemType Directory -Force -Path "release-assets/assets/hero" | Out-Null
    New-Item -ItemType Directory -Force -Path "release-assets/assets/promo" | Out-Null
}

Write-Host "🚀 Generating all extension assets..." -ForegroundColor Green
Write-Host ""

# Generate all assets
npx playwright test tests/e2e/assets/generate-assets.spec.ts --project=chromium

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Asset generation completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📸 Generated Screenshots:" -ForegroundColor Cyan
    Write-Host "  - options-overview.png"
    Write-Host "  - popup-token.png"
    Write-Host "  - spreadsheet-import.png"
    Write-Host "  - live-replacement.png"
    Write-Host ""
    Write-Host "🎨 Generated Hero Images:" -ForegroundColor Cyan
    Write-Host "  - hero-1400x560.png (Chrome Web Store)"
    Write-Host "  - hero-3000x2000.png (Microsoft Edge)"
    Write-Host "🧩 Promotional Tiles:" -ForegroundColor Cyan
    Write-Host "  - promo-440x280.png (Microsoft Edge Add-ons tile)"
    Write-Host ""
    Write-Host "📁 All assets saved to: release-assets/assets/" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Asset generation failed. Check the logs above for errors." -ForegroundColor Red
    exit 1
}