import { WaniKaniClient } from '~src/services/wanikani'

describe('WaniKaniClient', () => {
  const token = 'fake-token'
  let client: WaniKaniClient

  beforeEach(() => {
    client = new WaniKaniClient({ token, cacheTtlMs: 1000 })
    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockResolvedValue({
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
    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockReset()
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
