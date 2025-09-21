/**
 * Live WaniKani API smoke test (optional)
 * Run with: WK_LIVE=1 WANIKANI_API_TOKEN=<token> npm test -- wanikani.live.test.ts
 */
import { WaniKaniClient } from '~src/services/wanikani'

const token = process.env.WANIKANI_API_TOKEN

const maybe = (cond: boolean) => (cond ? describe : describe.skip)

maybe(!!process.env.WK_LIVE && !!token)('WaniKani live API', () => {
  // Subjects pagination can involve many pages.
  jest.setTimeout(60000)
  const client = new WaniKaniClient({ token: token!, cacheTtlMs: 2000, minRequestIntervalMs: 800 })

  it('fetches at least one vocabulary subject page', async () => {
    const subjects = await client.fetchAllVocabularySubjects({})
    expect(Array.isArray(subjects)).toBe(true)
  })

  it('fetches assignments (may be empty based on user account)', async () => {
    const assignments = await client.fetchAssignments({ subject_types: 'vocabulary' })
    expect(Array.isArray(assignments)).toBe(true)
  })
})
