/**
 * Live test to exercise conditional requests for assignments.
 * Run with: WK_LIVE=1 WANIKANI_API_TOKEN=<token> npm test -- wanikani.assignments.conditional.live.test.ts
 * Optional debug logging: set WK_DEBUG=1 to see 304 notices.
 */
import { WaniKaniClient } from '~src/services/wanikani'

const enabled = !!process.env.WK_LIVE && !!process.env.WANIKANI_API_TOKEN
const maybe = (c: boolean) => (c ? describe : describe.skip)

maybe(enabled)('WaniKani assignments conditional requests (live)', () => {
  jest.setTimeout(25000)
  const client = new WaniKaniClient({ token: process.env.WANIKANI_API_TOKEN!, cacheTtlMs: 500, minRequestIntervalMs: 800 })

  it('performs two sequential assignments fetches and reuses on 304', async () => {
    const first = await client.fetchAssignments({ subject_types: 'vocabulary' })
    expect(Array.isArray(first)).toBe(true)

    // Wait long enough that internal TTL expires so a new network request happens
    await new Promise(r => setTimeout(r, 1200))

    const second = await client.fetchAssignments({ subject_types: 'vocabulary' })
    expect(Array.isArray(second)).toBe(true)

    // We cannot assert 304 directly without intercepting fetch; rely on optional console.log
    // But sizes should match when unchanged.
    if (first.length === second.length) {
      console.info('[assignments.conditional.live] lengths unchanged', first.length)
    } else {
      console.info('[assignments.conditional.live] lengths changed first=', first.length, ' second=', second.length)
    }
  })
})
