import { TextReplacementEngine } from '~src/services/textReplacer'

/**
 * Regression: first vocabulary load now compiles synchronously so replacements
 * are available immediately (no need for setTimeout/idle flush).
 */

describe('TextReplacementEngine immediate first compile', () => {
  it('replaces immediately after first setVocabulary without awaiting timers', () => {
    const engine = new TextReplacementEngine()
    engine.updateConfig({ matchWholeWord: true, numbersReplacement: false })
    engine.setVocabulary(new Map([
      ['small', { japanese: '小さい' }],
      ['fox', { japanese: '狐' }]
    ]), new Set())

    const result = engine.replace('A small fox waits.')
    expect(result.value).toContain('小さい')
    expect(result.value).toContain('狐')
    expect(result.changed).toBe(true)
  })
})
