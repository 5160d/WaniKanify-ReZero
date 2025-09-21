import { TextReplacementEngine } from '~src/services/textReplacer'

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('TextReplacementEngine numbers replacement', () => {
  it('replaces numbers when enabled', () => {
    const engine = new TextReplacementEngine()
    engine.updateConfig({ numbersReplacement: true, matchWholeWord: true })
    engine.setVocabulary(new Map([['cat', { japanese: '猫' }]]), new Set())
    const result = engine.replace('I have 123 cat.')
    // 123 -> 一二三
    expect(result.value).toContain('一二三')
  })

  it('does not replace numbers when disabled', () => {
    const engine = new TextReplacementEngine()
    engine.updateConfig({ numbersReplacement: false, matchWholeWord: true })
    engine.setVocabulary(new Map(), new Set())
    const result = engine.replace('Value 456 here')
    expect(result.value).toContain('456')
    expect(result.value).not.toContain('四五六')
  })
})
