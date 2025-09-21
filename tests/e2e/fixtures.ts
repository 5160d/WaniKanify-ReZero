import { test as base, chromium, type BrowserContext } from '@playwright/test'
import path from 'path'

export const test = base.extend<{
  context: BrowserContext
  extensionId: string
}>({
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, '../../build/chrome-mv3-dev')
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium', // This is key for extension support!
      headless: false, // Extensions don't work in headless with channel chromium
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    })
    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    // For manifest v3, get the extension ID from service worker
    let [serviceWorker] = context.serviceWorkers()
    if (!serviceWorker) {
      try {
        serviceWorker = await context.waitForEvent('serviceworker', { timeout: 10000 })
      } catch (error) {
        // Fallback: try to get extension ID from existing pages
        const pages = context.pages()
        for (const page of pages) {
          if (page.url().startsWith('chrome-extension://')) {
            const extensionId = page.url().split('/')[2]
            await use(extensionId)
            return
          }
        }
        throw new Error('Could not find extension service worker or pages')
      }
    }

    const extensionId = serviceWorker.url().split('/')[2]
    await use(extensionId)
  },
})

export const expect = test.expect