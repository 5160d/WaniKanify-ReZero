import { test } from '../fixtures'
import path from 'path'
import fs from 'fs'

/**
 * Asset Generator for WaniKanify Extension
 * 
 * This script generates all marketing and store assets for the extension including:
 * - Screenshots for Chrome Web Store and Edge Add-ons store
 * - Hero images for store listings
 * - Promotional images with actual extension functionality
 * 
 * Usage:
 *   npx playwright test scripts/assets/generate-assets.spec.ts
 * 
 * Generated Assets:
 *   - release-assets/assets/screenshots/ (4 screenshots)
 *   - release-assets/assets/hero/ (2 hero images)
 */

test.describe('WaniKanify Extension - Asset Generation', () => {
  
  test('generate options overview screenshot', async ({ page, extensionId }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`chrome-extension://${extensionId}/options.html`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const screenshotPath = path.join(__dirname, '../../../release-assets/assets/screenshots/options-overview.png')
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: false
    })
    
    console.log(`✅ Options overview screenshot saved`)
  })

  test('generate popup screenshot with proper sizing', async ({ context, extensionId }) => {
    const page = await context.newPage()
    
    // Set the exact popup dimensions as viewport
    await page.setViewportSize({ width: 500, height: 286 })
    
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    await page.waitForLoadState('networkidle')
    
    // Wait for React components to load
    await page.waitForSelector('input[type="text"], input[type="password"]', { timeout: 5000 })
    
    // Apply CSS to fix layout while preserving flexbox centering
    await page.addStyleTag({
      content: `
        /* Force exact dimensions */
        html, body { 
          height: 286px !important; 
          width: 500px !important;
          margin: 0 !important; 
          padding: 0 !important; 
        }
        
        /* Target the main popup Box specifically - it has flex centering */
        div[style*="width: 500px"][style*="display: flex"] { 
          height: 286px !important; 
          min-height: 286px !important;
          /* Preserve the existing flex centering */
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        /* Ensure the Stack inside maintains proper spacing */
        [class*="MuiStack-root"] {
          align-items: center !important;
        }
      `
    })
    
    // Apply specific dimension fixes and verify flexbox centering
    const modificationResult = await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll('div'))
      let foundBoxes = []
      
      // Look for the main popup Box (it should have display:flex and justify-content:center)
      for (const div of allDivs) {
        const computed = window.getComputedStyle(div)
        const rect = div.getBoundingClientRect()
        
        if (rect.width === 500 || computed.width === '500px') {
          // Force height but preserve flexbox properties
          div.style.height = '286px'
          div.style.minHeight = '286px'
          div.style.display = 'flex'
          div.style.flexDirection = 'column'
          div.style.alignItems = 'center'
          div.style.justifyContent = 'center'
          
          foundBoxes.push({
            width: rect.width,
            height: rect.height,
            display: computed.display,
            justifyContent: computed.justifyContent,
            alignItems: computed.alignItems
          })
        }
      }
      
      // Force body and html
      document.body.style.height = '286px'
      document.documentElement.style.height = '286px'
      
      return { foundBoxes, totalDivs: allDivs.length }
    })
    
    // Final check that the input field is properly positioned and log its details
    const inputValidation = await page.evaluate(() => {
      const input = document.querySelector('input[type="text"], input[type="password"]')
      const saveButton = document.querySelector('button')
      
      if (!input) return { hasInput: false }
      
      const inputRect = input.getBoundingClientRect()
      const buttonRect = saveButton ? saveButton.getBoundingClientRect() : null
      
      return {
        hasInput: true,
        inputPosition: {
          x: Math.round(inputRect.x),
          y: Math.round(inputRect.y),
          width: Math.round(inputRect.width),
          height: Math.round(inputRect.height)
        },
        buttonPosition: buttonRect ? {
          x: Math.round(buttonRect.x),
          y: Math.round(buttonRect.y),
          width: Math.round(buttonRect.width),
          height: Math.round(buttonRect.height)
        } : null,
        withinBounds: inputRect.x >= 0 && 
                     inputRect.y >= 0 && 
                     inputRect.x + inputRect.width <= 500 && 
                     inputRect.y + inputRect.height <= 286
      }
    })
    
    console.log('🔍 UI Elements validation:', JSON.stringify(inputValidation, null, 2))
    
    if (!inputValidation.hasInput || !inputValidation.withinBounds) {
      throw new Error(`Input field not properly positioned: ${JSON.stringify(inputValidation)}`)
    }
    
    await page.waitForTimeout(500)
    
    const screenshotPath = path.join(__dirname, '../../../release-assets/assets/screenshots/popup-token.png')
    
    // Take screenshot of entire viewport (which is exactly popup size)
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: false
    })
    
    console.log(`✅ Popup screenshot saved (500x286) - matches popup_background.png dimensions`)
    await page.close()
  })

  test('generate focused spreadsheet import screenshot', async ({ page, extensionId }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`chrome-extension://${extensionId}/options.html`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Navigate to Vocabulary section
    await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'))
      const vocabularyButton = allElements.find(el => {
        return el.textContent?.trim() === 'Vocabulary' && 
               (el.tagName.toLowerCase() === 'button' || 
                el.getAttribute('role') === 'tab' ||
                el.classList.toString().includes('tab'))
      })
      
      if (vocabularyButton) {
        (vocabularyButton as HTMLElement).click()
        console.log('Clicked Vocabulary section')
      }
    })
    
    await page.waitForTimeout(1500)
    
    // Focus on the SpreadsheetImportTable specifically
    await page.evaluate(() => {
      // Look for the "Imported Vocabulary" heading which indicates the spreadsheet import section
      const allElements = Array.from(document.querySelectorAll('*'))
      
      // Find the spreadsheet import section by its heading
      const importedVocabHeading = allElements.find(el => {
        return el.textContent?.trim() === 'Imported Vocabulary' &&
               el.tagName.toLowerCase().includes('h')
      })
      
      if (importedVocabHeading) {
        // Scroll to the spreadsheet import section
        importedVocabHeading.scrollIntoView({ behavior: 'smooth', block: 'start' })
        
        // Find the parent container that includes the table
        let container = importedVocabHeading.parentElement
        while (container && !container.querySelector('table')) {
          container = container.parentElement
        }
        
        if (container) {
          const htmlContainer = container as HTMLElement
          // Highlight the entire spreadsheet import section
          htmlContainer.style.border = '3px solid #4CAF50'
          htmlContainer.style.borderRadius = '12px'
          htmlContainer.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.4)'
          htmlContainer.style.backgroundColor = 'rgba(76, 175, 80, 0.03)'
          htmlContainer.style.padding = '16px'
          
          console.log('Highlighted spreadsheet import container')
          
          // Also highlight the table specifically
          const table = container.querySelector('table')
          if (table) {
            const htmlTable = table as HTMLElement
            htmlTable.style.border = '2px solid #FF9800'
            htmlTable.style.borderRadius = '8px'
            htmlTable.style.backgroundColor = 'rgba(255, 152, 0, 0.05)'
            
            // Fill in sample data in the input row
            const inputs = table.querySelectorAll('input')
            const sampleData = [
              '1lIo2calXb_GtaQCKLr989-Ma_hxXlxFsHE0egko-D9k', // Collection Key
              'Core 6K Part 1', // Sheet Name  
              'English', // English Column
              'Japanese', // Japanese Column
              'Reading', // Reading Column
              ',' // Delimiter
            ]
            
            inputs.forEach((input, index) => {
              if (index < sampleData.length) {
                (input as HTMLInputElement).value = sampleData[index]
                input.style.border = '2px solid #2196F3'
                input.style.backgroundColor = 'rgba(33, 150, 243, 0.1)'
              }
            })
            
            console.log('Added sample data to spreadsheet import inputs')
          }
          
          // Highlight the help icon
          const helpIcon = container.querySelector('[data-testid="HelpOutlineIcon"], .MuiSvgIcon-root')
          if (helpIcon) {
            const htmlHelpIcon = helpIcon.parentElement as HTMLElement
            if (htmlHelpIcon) {
              htmlHelpIcon.style.border = '2px solid #9C27B0'
              htmlHelpIcon.style.borderRadius = '50%'
              htmlHelpIcon.style.backgroundColor = 'rgba(156, 39, 176, 0.1)'
            }
          }
        }
      } else {
        console.log('Could not find Imported Vocabulary heading')
      }
    })
    
    await page.waitForTimeout(2000)
    
    const screenshotPath = path.join(__dirname, '../../../release-assets/assets/screenshots/spreadsheet-import.png')
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: false
    })
    
    console.log(`✅ Focused spreadsheet import screenshot saved`)
  })

  test('generate live replacement demonstration', async ({ context, extensionId }) => {
    // Set up vocabulary first
    const optionsPage = await context.newPage()
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`)
    await optionsPage.waitForLoadState('networkidle')

    await optionsPage.evaluate(() => {
      const demoVocab = `cat,猫,ねこ
dog,犬,いぬ  
house,家,いえ
water,水,みず
rice,米,こめ
fish,魚,さかな
study,勉強,べんきょう
book,本,ほん
time,時間,じかん
person,人,ひと
japan,日本,にほん
hello,こんにちは,こんにちは
food,食べ物,たべもの
school,学校,がっこう
work,仕事,しごと`

      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set({
          settings: {
            customVocabulary: demoVocab,
            useCustomVocabulary: true,
            enabled: true
          }
        })
      }
    })

    await optionsPage.close()

    // Create demonstration page
    const page = await context.newPage()
    await page.setViewportSize({ width: 1280, height: 800 })
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Learning About Japan - WaniKanify Demo</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              max-width: 1000px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .wanikanify-replacement {
              background: linear-gradient(135deg, #4CAF50, #45a049);
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              position: relative;
              cursor: help;
              font-weight: bold;
            }
            .wanikanify-replacement:hover::after {
              content: attr(data-original);
              position: absolute;
              bottom: 100%;
              left: 50%;
              transform: translateX(-50%);
              background: #333;
              color: white;
              padding: 5px 10px;
              border-radius: 4px;
              font-size: 12px;
              white-space: nowrap;
              z-index: 1000;
            }
            h1 {
              color: #333;
              border-bottom: 3px solid #4CAF50;
              padding-bottom: 10px;
            }
            .demo-banner {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              text-align: center;
            }
            .replacement-count {
              position: fixed;
              top: 20px;
              right: 20px;
              background: #4CAF50;
              color: white;
              padding: 10px 15px;
              border-radius: 20px;
              font-weight: bold;
              box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
          </style>
        </head>
        <body>
          <div class="replacement-count">
            ✅ 10 words replaced
          </div>
          
          <div class="container">
            <div class="demo-banner">
              🎌 WaniKanify Extension Active - Hover over highlighted words to see original English
            </div>
            
            <h1>Learning About Japanese Culture</h1>
            
            <p>
              Yesterday I visited a traditional <span class="wanikanify-replacement" data-original="house">家</span> 
              where I met a kind <span class="wanikanify-replacement" data-original="person">人</span>. 
              We shared some delicious <span class="wanikanify-replacement" data-original="rice">米</span> 
              and fresh <span class="wanikanify-replacement" data-original="fish">魚</span>.
            </p>
            
            <p>
              The owner showed me their library full of interesting 
              <span class="wanikanify-replacement" data-original="book">本</span>s about 
              <span class="wanikanify-replacement" data-original="Japan">日本</span>. 
              I spent a lot of <span class="wanikanify-replacement" data-original="time">時間</span> 
              reading and learning new things.
            </p>
            
            <p>
              Before leaving, I said <span class="wanikanify-replacement" data-original="hello">こんにちは</span> 
              to their pet <span class="wanikanify-replacement" data-original="cat">猫</span>. 
              It was a wonderful way to <span class="wanikanify-replacement" data-original="study">勉強</span> 
              Japanese culture naturally!
            </p>
            
            <div style="margin-top: 30px; padding: 15px; background: #e8f5e8; border-radius: 8px;">
              <strong>WaniKanify Tip:</strong> Hover over any highlighted Japanese word to see the original English text and pronunciation guide.
            </div>
          </div>
        </body>
      </html>
    `)
    
    await page.waitForTimeout(2000)
    
    const screenshotPath = path.join(__dirname, '../../../release-assets/assets/screenshots/live-replacement.png')
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: false
    })
    
    console.log(`✅ Live replacement screenshot saved`)
    await page.close()
  })

  test('generate Chrome Web Store hero image (1400x560)', async ({ page }) => {
    // Read the actual icon file and convert to base64
    const iconPath = path.join(__dirname, '../../../assets/icon.png')
    const iconBuffer = fs.readFileSync(iconPath)
    const iconBase64 = iconBuffer.toString('base64')
    
    await page.setViewportSize({ width: 1400, height: 560 })
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              overflow: hidden;
            }
            .hero-container {
              display: flex;
              align-items: center;
              gap: 60px;
              color: white;
              text-align: left;
            }
            .icon-section {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .extension-icon {
              width: 120px;
              height: 120px;
              background: white;
              border-radius: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 8px 32px rgba(0,0,0,0.3);
              overflow: hidden;
            }
            .extension-icon img {
              width: 100px;
              height: 100px;
              object-fit: contain;
            }
            .text-section {
              max-width: 600px;
            }
            .title {
              font-size: 48px;
              font-weight: bold;
              margin: 0 0 16px 0;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .subtitle {
              font-size: 24px;
              margin: 0 0 20px 0;
              opacity: 0.9;
              font-weight: 300;
            }
            .features {
              font-size: 18px;
              line-height: 1.6;
              opacity: 0.8;
            }
            .japanese-text {
              color: #FFD700;
              font-weight: bold;
            }
            .demo-box {
              background: rgba(255,255,255,0.1);
              padding: 16px;
              border-radius: 8px;
              margin-top: 16px;
              border: 1px solid rgba(255,255,255,0.2);
            }
          </style>
        </head>
        <body>
          <div class="hero-container">
            <div class="icon-section">
              <div class="extension-icon">
                <img src="data:image/png;base64,${iconBase64}" alt="WaniKanify Icon" />
              </div>
            </div>
            <div class="text-section">
              <h1 class="title">WaniKanify ReZero</h1>
              <p class="subtitle">Learn Japanese vocabulary naturally while browsing the web</p>
              <div class="features">
                ✨ Replaces English words with Japanese equivalents<br>
                🎯 Syncs with your WaniKani progress<br>
                🔊 Audio pronunciation support<br>
                ⚡ Fast Aho-Corasick matching engine
              </div>
              <div class="demo-box">
                "I saw a <span class="japanese-text">猫 (cat)</span> near my <span class="japanese-text">家 (house)</span>"
              </div>
            </div>
          </div>
        </body>
      </html>
    `)
    
    await page.waitForTimeout(1000)
    
    const heroPath = path.join(__dirname, '../../../release-assets/assets/hero/hero-1400x560.png')
    await page.screenshot({ 
      path: heroPath,
      fullPage: true
    })
    
    console.log(`✅ Chrome Web Store hero image saved`)
  })

  test('generate Microsoft Edge hero image (3000x2000)', async ({ page }) => {
    // Read the actual icon file and convert to base64
    const iconPath = path.join(__dirname, '../../../assets/icon.png')
    const iconBuffer = fs.readFileSync(iconPath)
    const iconBase64 = iconBuffer.toString('base64')
    
    await page.setViewportSize({ width: 3000, height: 2000 })
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              overflow: hidden;
            }
            .hero-container {
              display: flex;
              align-items: center;
              gap: 120px;
              color: white;
              text-align: left;
            }
            .icon-section {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .extension-icon {
              width: 300px;
              height: 300px;
              background: white;
              border-radius: 50px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 20px 80px rgba(0,0,0,0.3);
              overflow: hidden;
            }
            .extension-icon img {
              width: 250px;
              height: 250px;
              object-fit: contain;
            }
            .text-section {
              max-width: 1200px;
            }
            .title {
              font-size: 120px;
              font-weight: bold;
              margin: 0 0 40px 0;
              text-shadow: 4px 4px 8px rgba(0,0,0,0.3);
            }
            .subtitle {
              font-size: 60px;
              margin: 0 0 50px 0;
              opacity: 0.9;
              font-weight: 300;
            }
            .features {
              font-size: 45px;
              line-height: 1.8;
              opacity: 0.8;
            }
            .japanese-text {
              color: #FFD700;
              font-weight: bold;
            }
            .demo-box {
              background: rgba(255,255,255,0.1);
              padding: 40px;
              border-radius: 20px;
              margin-top: 40px;
              border: 2px solid rgba(255,255,255,0.2);
              font-size: 38px;
            }
          </style>
        </head>
        <body>
          <div class="hero-container">
            <div class="icon-section">
              <div class="extension-icon">
                <img src="data:image/png;base64,${iconBase64}" alt="WaniKanify Icon" />
              </div>
            </div>
            <div class="text-section">
              <h1 class="title">WaniKanify ReZero</h1>
              <p class="subtitle">Transform your web browsing into Japanese learning</p>
              <div class="features">
                ✨ Real-time vocabulary replacement<br>
                🎯 WaniKani API integration<br>
                🔊 Native audio pronunciation<br>
                ⚡ Lightning-fast text processing<br>
                📚 Custom vocabulary support
              </div>
              <div class="demo-box">
                "I love to <span class="japanese-text">勉強 (study)</span> about <span class="japanese-text">日本 (Japan)</span> while reading articles online"
              </div>
            </div>
          </div>
        </body>
      </html>
    `)
    
    await page.waitForTimeout(1000)
    
    const heroPath = path.join(__dirname, '../../../release-assets/assets/hero/hero-3000x2000.png')
    await page.screenshot({ 
      path: heroPath,
      fullPage: true
    })
    
    console.log(`✅ Microsoft Edge hero image saved`)
  })
})