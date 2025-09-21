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
})
