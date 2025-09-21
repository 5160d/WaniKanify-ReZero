// Jest test for incremental WaniKani subject fetching using updated_after
// Import the background AFTER setting up any needed globals to avoid undefined chrome.action errors.
let controller: any

// NOTE: This is a high-level integration-ish test; we will mock only fetch.

// Provide mock DEFAULT_SETTINGS with a token so background refresh proceeds.
jest.mock('~src/components/settings/constants', () => ({
  DEFAULT_SETTINGS: {
    version: 1,
    apiToken: 'TEST_TOKEN',
    autoRun: true,
    audio: { mode: 'click' },
    showReplacementTooltips: true,
    numbersReplacement: 'off',
    performanceTelemetry: false,
    srsGroups: { apprentice: true, guru: true, master: true, enlightened: true, burned: true },
    customVocabulary: new Map(),
    vocabularyBlacklist: new Set(),
    sitesFiltering: [],
    spreadsheetImport: { history: [] },
    siteOverrides: {}
  }
}))

const mkSubject = (id: number, updatedAt: string, english = 'word'+id) => ({
  id,
  object: 'vocabulary',
  url: 'https://api.wanikani.com/v2/subjects/'+id,
  data_updated_at: updatedAt,
  data: { slug: english, characters: '字'+id, meanings: [{ meaning: english, primary: true, accepted_answer: true }] }
})

let fetchImpl: any
let calls: string[] = []

beforeAll(async () => {
  // Provide minimal chrome mocks required by background.ts
  const g: any = global
  if (!g.chrome) g.chrome = {}
  if (!g.chrome.runtime) g.chrome.runtime = {}
  g.chrome.runtime.onInstalled = g.chrome.runtime.onInstalled || { addListener: jest.fn() }
  g.chrome.runtime.onStartup = g.chrome.runtime.onStartup || { addListener: jest.fn() }
  g.chrome.runtime.onMessage = g.chrome.runtime.onMessage || { addListener: jest.fn() }
  g.chrome.runtime.sendMessage = g.chrome.runtime.sendMessage || jest.fn()
  g.chrome.runtime.openOptionsPage = g.chrome.runtime.openOptionsPage || jest.fn()
  g.chrome.runtime.setUninstallURL = g.chrome.runtime.setUninstallURL || jest.fn()
  if (!g.chrome.storage) {
    g.chrome.storage = { local: {}, sync: {}, onChanged: { addListener: jest.fn() } }
  }
  if (!g.chrome.alarms) {
    g.chrome.alarms = { create: jest.fn(), onAlarm: { addListener: jest.fn() } }
  }
  if (!g.chrome.action) {
    g.chrome.action = { setPopup: jest.fn(), onClicked: { addListener: jest.fn() } }
  }
  // Mock fetch
  fetchImpl = global.fetch
  global.fetch = jest.fn(async (url: string) => {
    calls.push(url)
    const u = new URL(url)
    const updatedAfter = u.searchParams.get('updated_after')
    if (u.pathname.endsWith('/subjects')) {
      if (updatedAfter) {
        // Incremental: return only newer subject if updated_after less than its ts
        return ok({
          object: 'collection',
            data: [mkSubject(2, new Date(Date.now()+1000).toISOString(), 'newer')],
            data_updated_at: new Date().toISOString(),
            pages: { per_page: 500, next_url: null, previous_url: null },
            total_count: 1,
            url
        })
      }
      // Full baseline
      return ok({
        object: 'collection',
        data: [mkSubject(1, new Date().toISOString(), 'base')],
        data_updated_at: new Date().toISOString(),
        pages: { per_page: 500, next_url: null, previous_url: null },
        total_count: 1,
        url
      })
    }
    if (u.pathname.endsWith('/assignments')) {
      return ok({ object: 'collection', data: [], data_updated_at: new Date().toISOString(), pages: { per_page: 500, next_url: null, previous_url: null }, total_count: 0, url })
    }
    return { ok: false, status: 404, text: async () => 'not found' }
  }) as any
  // Dynamic import after mocks
  const mod = await import('~src/background')
  controller = (mod as any).controller
})

afterAll(() => { global.fetch = fetchImpl })

const ok = (body: any) => ({ ok: true, status: 200, json: async () => body })

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

describe('incremental subjects updated_after', () => {
  it('performs baseline then incremental merge', async () => {
    // Force first refresh (baseline) by clearing internal cache state
    await (controller as any).refreshVocabulary(true)
  const firstCache = (controller as any).vocabularyCache || (controller as any).__getVocabularyCacheForTest?.()
    expect(firstCache?.wanikaniSubjects?.length).toBe(1)
    const firstUpdatedAt = firstCache?.lastSubjectsUpdatedAt

    // Second refresh (incremental)
    await (controller as any).refreshVocabulary(true)
  const secondCache = (controller as any).vocabularyCache || (controller as any).__getVocabularyCacheForTest?.()
    expect(secondCache?.wanikaniSubjects?.length).toBe(2)
    expect(new Date(secondCache!.lastSubjectsUpdatedAt!).getTime()).toBeGreaterThanOrEqual(new Date(firstUpdatedAt!).getTime())
  })
})
