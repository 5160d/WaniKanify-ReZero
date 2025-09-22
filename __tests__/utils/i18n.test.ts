import { t, allKeys } from "~src/utils/i18n"

describe('i18n utility', () => {
  test('returns a known key value', () => {
    expect(t('popup_save_button')).toBe('Save')
  })

  test('falls back to key when missing', () => {
    const missing = 'non_existent_key_xyz'
    expect(t(missing)).toBe(missing)
  })

  test('applies substitutions', () => {
    const msg = t('blacklist_error_too_many_entries', { USED: 1200, MAX: 1000 })
    expect(msg).toBe('Too many entries: 1200 / 1000')
  })

  test('lists keys', () => {
    const keys = allKeys()
    expect(keys).toContain('popup_api_token_label')
  })
})
