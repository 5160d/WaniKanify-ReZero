/**
 * Optional live incremental subjects test.
 * Enable with: WK_LIVE=1 WANIKANI_API_TOKEN=<token> npm test -- wanikani.incremental.live.test.ts
 */
import { WaniKaniClient, type WaniKaniSubject } from '~src/services/wanikani'

const enabled = !!process.env.WK_LIVE && !!process.env.WANIKANI_API_TOKEN
const maybe = (cond: boolean) => (cond ? describe : describe.skip)

const computeMaxUpdatedAt = (subs: WaniKaniSubject[]) => {
  if (!subs.length) return undefined
  const max = Math.max(...subs.map(s => Date.parse(s.data_updated_at)))
  return new Date(max).toISOString()
}

maybe(enabled)('WaniKani live incremental subjects', () => {
  jest.setTimeout(15000)
  const client = new WaniKaniClient({ token: process.env.WANIKANI_API_TOKEN!, cacheTtlMs: 1500, minRequestIntervalMs: 800 })

  it('fetches baseline then incremental (possibly empty) set', async () => {
    const baseline = await client.fetchAllVocabularySubjects({})
    if (!baseline.length) {
      console.info('[wanikani.incremental.live] baseline empty – skipping deeper assertions (likely new account)')
      expect(Array.isArray(baseline)).toBe(true)
      return
    }

    const maxTs = computeMaxUpdatedAt(baseline)!
    // Capture top 3 most recently updated baseline subjects for diagnostic purposes.
    const topRecent = [...baseline]
      .sort((a, b) => Date.parse(b.data_updated_at) - Date.parse(a.data_updated_at))
      .slice(0, 3)
      .map(s => ({ id: s.id, slug: s.data?.slug, updated: s.data_updated_at }))
    console.info('[wanikani.incremental.live] baseline maxTs:', maxTs, 'topRecent:', topRecent)

  const incremental = await client.fetchAllVocabularySubjects({ updated_after: maxTs })

    expect(Array.isArray(incremental)).toBe(true)
    // Validate timestamp monotonicity
    incremental.forEach(s => {
      expect(Date.parse(s.data_updated_at)).toBeGreaterThanOrEqual(Date.parse(maxTs))
    })

    if (incremental.length) {
      const baselineIds = new Set(baseline.map(s => s.id))
      // Log a capped preview to help manually verify unexpected updates.
      const preview = incremental.slice(0, 5).map(s => ({
        id: s.id,
        slug: s.data?.slug,
        updated: s.data_updated_at,
        duplicate: baselineIds.has(s.id)
      }))
      console.info(`[wanikani.incremental.live] incremental detailed preview (first ${preview.length}/${incremental.length}):`, preview)
      const duplicates = preview.filter(p => p.duplicate)
      if (duplicates.length) {
        console.info('[wanikani.incremental.live] NOTE: incremental contained duplicate IDs relative to baseline (likely API updated_after inclusivity or timestamp precision).')
      }
    }

    // Diagnostic logging (non-fatal)
    console.info(`[wanikani.incremental.live] baseline=${baseline.length} incremental=${incremental.length}`)
  })
})
