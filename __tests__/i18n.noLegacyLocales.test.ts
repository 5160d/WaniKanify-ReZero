/**
 * Guard test ensuring we do not accidentally reintroduce the legacy `_locales` source directory.
 * The authoritative catalog now lives in `/locales/en/messages.json` which Plasmo copies for packaging.
 */
import fs from 'fs'
import path from 'path'

describe('i18n legacy _locales directory', () => {
  it('has been removed (no stray _locales messages.json remains)', () => {
    const root = path.join(__dirname, '..')
    const legacyPath = path.join(root, '_locales', 'en', 'messages.json')
    expect(fs.existsSync(legacyPath)).toBe(false)
  })
})
