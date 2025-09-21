import { computeMaxUpdatedAt } from '~src/services/wanikani/computeMaxUpdatedAt'
import type { WaniKaniSubject } from '~src/services/wanikani'

describe('computeMaxUpdatedAt', () => {
  const mk = (id: number, ts: string): WaniKaniSubject => ({
    id,
    object: 'vocabulary',
    url: '',
    data_updated_at: ts,
    data: { slug: 's'+id, characters: '', meanings: [{ meaning: 'm', primary: true, accepted_answer: true }] }
  })

  it('returns undefined for empty array', () => {
    expect(computeMaxUpdatedAt([])).toBeUndefined()
  })

  it('selects max by millisecond', () => {
    const a = mk(1, '2025-09-18T10:00:00.000Z')
    const b = mk(2, '2025-09-18T10:00:01.000Z')
    expect(computeMaxUpdatedAt([a, b])).toBe(b.data_updated_at)
  })

  it('preserves higher precision within same millisecond', () => {
    const base = '2025-09-18T10:00:00.123'
    const a = mk(1, base + '000Z')
    const b = mk(2, base + '456Z')
    const c = mk(3, base + '789Z')
    expect(computeMaxUpdatedAt([a, b, c])).toBe(c.data_updated_at)
  })

  it('keeps lexicographically larger when ms identical', () => {
    const a = mk(1, '2025-09-18T10:00:00.123000Z')
    const b = mk(2, '2025-09-18T10:00:00.123999Z')
    expect(computeMaxUpdatedAt([a, b])).toBe(b.data_updated_at)
  })

})
