import { WaniKaniClient } from '~src/services/wanikani'

describe('WaniKaniClient', () => {
  const token = 'fake-token'
  let client: WaniKaniClient
  let originalFetch: any

  beforeEach(() => {
    originalFetch = global.fetch
    global.fetch = jest.fn()
    client = new WaniKaniClient({ token, cacheTtlMs: 1000 })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [],
        pages: { next_url: null },
        data_updated_at: '',
        object: 'collection',
        url: '',
        total_count: 0
      })
    })
  })

  afterEach(() => {
    if ((global.fetch as any)?.mockReset) {
      try { (global.fetch as jest.Mock).mockReset() } catch (_) {}
    }
    global.fetch = originalFetch
  })

  it('throws when token is missing', async () => {
    const unauthenticated = new WaniKaniClient()
    await expect(unauthenticated.fetchAssignments()).rejects.toThrow('Missing WaniKani API token')
  })

  it('fetches assignments with provided token', async () => {
    await client.fetchAssignments({ subject_types: 'vocabulary' })
    expect((global.fetch as jest.Mock)).toHaveBeenCalled()
  })

  it('uses If-Modified-Since and reuses stale value on 304', async () => {
    jest.useFakeTimers()
    const firstBody = {
      data: [{ id: 1, object: 'assignment', data: { subject_id: 10, subject_type: 'vocabulary', srs_stage: 1, unlocked_at: null, available_at: null, passed_at: null, burned_at: null } }],
      pages: { next_url: null },
      data_updated_at: '2025-09-21T10:00:00.000Z',
      object: 'collection',
      url: '',
      total_count: 1
    }

    // First 200 response with Last-Modified header
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (h: string) => (h === 'Last-Modified' ? 'Wed, 21 Sep 2025 10:00:00 GMT' : null) },
      json: async () => firstBody
    })

  const first = await client.fetchAssignments({})
  // Advance beyond cache TTL (1000ms) so next call isn't served from cache
  jest.advanceTimersByTime(1500)
    expect(first.length).toBe(1)

    // Second response 304 Not Modified (no body) – ensure client returns stale value
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 304,
      headers: { get: () => null }
    })

  const second = await client.fetchAssignments({})
    expect(second).toEqual(first)

    // Validate that If-Modified-Since header was sent on second call
    const calls = (global.fetch as jest.Mock).mock.calls
    expect(calls.length).toBe(2)
    const secondHeaders = calls[1][1].headers
    expect(secondHeaders['If-Modified-Since']).toBe('Wed, 21 Sep 2025 10:00:00 GMT')
    jest.useRealTimers()
  })
})
