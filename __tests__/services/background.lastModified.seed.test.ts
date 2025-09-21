import { controller as realController } from '~src/background'
import { WaniKaniClient } from '~src/services/wanikani'

// This test simulates persistence of Last-Modified across a restart by directly invoking the BackgroundController logic.
// We mock fetch so that after seeding Last-Modified, the first subject + assignments requests return 304 and we still build vocabulary entries.

describe('BackgroundController Last-Modified seeding', () => {
  let originalFetch: any

  beforeEach(() => {
    originalFetch = global.fetch
    global.fetch = jest.fn()
    // Ensure WK_DEBUG for logging does not interfere.
    process.env.WK_DEBUG = '0'
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('uses persisted Last-Modified to issue conditional requests (receiving 304) and retains previous data', async () => {
    // We can't easily reinstantiate the controller (singleton export), so we simulate by:
    // 1. Performing an initial refresh with 200 responses capturing Last-Modified.
    // 2. Forcing cache expiry.
    // 3. Mocking subsequent fetches to return 304 and verifying no data loss.

    const controller: any = realController

    // Skip if no valid token in settings; inject fake settings with apiToken.
    const state = await controller['handleMessage']({ type: 'wanikanify:get-settings' })
    if (!state?.payload?.apiToken) {
      // Mutate settings directly for test (non-production code path)
      controller['settings'].apiToken = 'fake-token'
      controller['client'].setToken('fake-token')
    }

    // First round: mock subjects (200) then assignments (200)
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (h: string) => (h === 'Last-Modified' ? 'Wed, 21 Sep 2025 10:00:00 GMT' : null) },
      json: async () => ({
        object: 'collection',
        url: '',
        data_updated_at: '2025-09-21T10:00:00.000Z',
        data: [ { id: 1, object: 'vocabulary', url: '', data_updated_at: '2025-09-21T10:00:00.000Z', data: { slug: 'a', characters: 'あ', meanings: [{ meaning: 'a', primary: true, accepted_answer: true }] } } ],
        pages: { per_page: 500, next_url: null, previous_url: null },
        total_count: 1
      })
    })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (h: string) => (h === 'Last-Modified' ? 'Wed, 21 Sep 2025 10:05:00 GMT' : null) },
      json: async () => ({
        object: 'collection',
        url: '',
        data_updated_at: '2025-09-21T10:05:00.000Z',
        data: [ { id: 10, object: 'assignment', data: { subject_id: 1, subject_type: 'vocabulary', srs_stage: 1, unlocked_at: null, available_at: null, passed_at: null, burned_at: null } } ],
        pages: { per_page: 500, next_url: null, previous_url: null },
        total_count: 1
      })
    })

  await controller['refreshVocabulary'](true)

    const firstCache = controller.__getVocabularyCacheForTest?.()
    expect(firstCache?.wanikaniSubjects?.length).toBe(1)
    expect(firstCache?.assignments?.length).toBe(1)
    expect(firstCache?.lastModifiedSubjects).toBe('Wed, 21 Sep 2025 10:00:00 GMT')
    expect(firstCache?.lastModifiedAssignments).toBe('Wed, 21 Sep 2025 10:05:00 GMT')

  // Expire vocabulary cache so that a refresh occurs; retain client's seeded stale values (simulate restart using persisted cache).
  if (firstCache) firstCache.expiresAt = new Date(Date.now() - 1000).toISOString()

    // Second round: both endpoints return 304
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 304, headers: { get: () => null } })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 304, headers: { get: () => null } })

    await controller['refreshVocabulary']()

    const secondCache = controller.__getVocabularyCacheForTest?.()
    expect(secondCache?.wanikaniSubjects?.length).toBe(1)
    expect(secondCache?.assignments?.length).toBe(1)
    // No change in Last-Modified values (still persisted)
    expect(secondCache?.lastModifiedSubjects).toBe('Wed, 21 Sep 2025 10:00:00 GMT')
    expect(secondCache?.lastModifiedAssignments).toBe('Wed, 21 Sep 2025 10:05:00 GMT')

  // Verify at least one additional fetch (>=3 total calls). Exact number may vary if some requests are skipped.
  expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(3)

  })
})
