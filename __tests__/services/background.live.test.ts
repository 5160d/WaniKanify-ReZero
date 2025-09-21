/**
 * Simplified live refresh behavior test (without full background controller to reduce flakiness/time).
 * Verifies incremental semantics using WaniKaniClient directly plus assignments fetch.
 * Enable with: WK_LIVE=1 WANIKANI_API_TOKEN=<token> npm test -- background.live.test.ts
 */
import { WaniKaniClient } from '~src/services/wanikani'

const enabled = !!process.env.WK_LIVE && !!process.env.WANIKANI_API_TOKEN
const maybe = (c: boolean) => (c ? describe : describe.skip)

maybe(enabled)('Background live refresh (client simulation)', () => {
  jest.setTimeout(45000)
  const client = new WaniKaniClient({ token: process.env.WANIKANI_API_TOKEN!, minRequestIntervalMs: 800, cacheTtlMs: 1500 })

  const computeMax = (subs: any[]) => subs.length ? new Date(Math.max(...subs.map(s => Date.parse(s.data_updated_at)))).toISOString() : undefined

  it('fetches baseline subjects, assignments, then incremental subjects', async () => {
    const baseline = await client.fetchAllVocabularySubjects({})
    expect(Array.isArray(baseline)).toBe(true)
    const max = computeMax(baseline)
    const assignments = await client.fetchAssignments({ subject_types: 'vocabulary' })
    expect(Array.isArray(assignments)).toBe(true)

    // wait a bit then attempt incremental (may be empty)
    await new Promise(r => setTimeout(r, 1200))
    if (max) {
      const incremental = await client.fetchAllVocabularySubjects({ updated_after: max })
      incremental.forEach(s => {
        expect(Date.parse(s.data_updated_at)).toBeGreaterThanOrEqual(Date.parse(max))
      })
      console.info(`[background.live.sim] baseline=${baseline.length} incremental=${incremental.length} assignments=${assignments.length}`)
    }
  })
})
