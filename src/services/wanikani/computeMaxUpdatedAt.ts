import type { WaniKaniSubject } from '~src/services/wanikani'

// Simplified helper: compute max updated_at (keeping original string when tied on ms)
export const computeMaxUpdatedAt = (subjects: WaniKaniSubject[] | undefined): string | undefined => {
  if (!subjects || subjects.length === 0) return undefined
  let best: string | undefined
  let bestMs = -1
  for (const s of subjects) {
    const ts = s.data_updated_at
    if (!ts) continue
    const ms = Date.parse(ts)
    if (ms > bestMs) {
      best = ts
      bestMs = ms
      continue
    }
    if (ms === bestMs && best && ts > best) {
      best = ts
    }
  }
  return best
}
