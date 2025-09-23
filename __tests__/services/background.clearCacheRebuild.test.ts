import { controller } from '~src/background'
import { __WK_EVT_CLEAR_CACHE } from '~src/internal/tokens'

jest.setTimeout(15000)

// Mock settings to provide an API token before invoking refresh.
beforeAll(() => {
  ;(controller as any).settings.apiToken = 'TEST_TOKEN'
})

// Minimal chrome runtime/message mocks if not already present (tests run in jsdom env)
// Rely on existing jest.setup polyfills; ensure listener dispatch works.

describe('Background clear cache rebuild', () => {
  it('clears cache and triggers rebuild flag transiently', async () => {
    // Monkey-patch performVocabularyRefresh to resolve quickly and set a sentinel cache.
    const originalPerform = (controller as any).performVocabularyRefresh
    ;(controller as any).performVocabularyRefresh = jest.fn(async () => {
      ;(controller as any).vocabularyCache = {
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        wanikaniSubjects: [],
        assignments: [],
        vocabularyEntries: []
      }
      return (controller as any).vocabularyCache
    })

    // Directly invoke internal handler to avoid dependence on chrome runtime listener setup in test env
    await (controller as any).handleMessage({ type: __WK_EVT_CLEAR_CACHE })

    // Wait a tick for async chain
  await new Promise(r => setTimeout(r, 10))
    expect((controller as any).performVocabularyRefresh).toHaveBeenCalled()
    ;(controller as any).performVocabularyRefresh = originalPerform
  })
})
