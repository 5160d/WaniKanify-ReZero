import { WaniKaniClient } from '~src/services/wanikani'

// Tests conditional 304 handling for subjects incremental fetch producing empty delta

describe('WaniKaniClient subjects conditional 304 incremental', () => {
  const token = 'fake-token'
  let client: WaniKaniClient
  let originalFetch: any

  beforeEach(() => {
    originalFetch = global.fetch
    global.fetch = jest.fn()
    client = new WaniKaniClient({ token, cacheTtlMs: 10, minRequestIntervalMs: 0 })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('returns empty collection on incremental 304 without re-sending full cache', async () => {
    // First call: baseline subjects page (200)
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (h: string) => (h === 'Last-Modified' ? 'Wed, 21 Sep 2025 10:00:00 GMT' : null) },
      json: async () => ({
        object: 'collection',
        url: 'https://api.wanikani.com/v2/subjects?types=vocabulary',
        data_updated_at: '2025-09-21T10:00:00.000Z',
        data: [ { id: 1, object: 'vocabulary', url: '', data_updated_at: '2025-09-21T10:00:00.000Z', data: { slug: 'a', characters: 'あ', meanings: [{ meaning: 'a', primary: true, accepted_answer: true }] } } ],
        pages: { per_page: 500, next_url: null, previous_url: null },
        total_count: 1
      })
    })

    const baseline = await client.fetchAllVocabularySubjects({})
    expect(baseline.length).toBe(1)

    // Second call: incremental with updated_after + 304 Not Modified
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 304,
      headers: { get: () => null }
    })

    const delta = await client.fetchAllVocabularySubjects({ updated_after: '2025-09-21T10:00:00.000Z' })
    expect(delta.length).toBe(0)

    // Ensure two fetches happened
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(2)
  })
})
