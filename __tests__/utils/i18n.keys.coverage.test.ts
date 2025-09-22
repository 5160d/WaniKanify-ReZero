import { t, allKeys } from 'src/utils/i18n'

// This test ensures every messages.json key resolves to a non-empty string.
// Acts as a safety net if an import path or bundling regression breaks localization.

describe('i18n key coverage', () => {
  it('all keys resolve to a non-empty string', () => {
    const keys = allKeys()
    expect(keys.length).toBeGreaterThan(0)
    for (const k of keys) {
      const value = t(k)
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })
})
