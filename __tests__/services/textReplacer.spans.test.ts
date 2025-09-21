import { TextReplacementEngine } from '~src/services/textReplacer'

describe('TextReplacementEngine replacement span attributes', () => {
  it('tracks matches with original and reading for tooltip usage', () => {
    const engine = new TextReplacementEngine()
    engine.updateConfig({ matchWholeWord: true, numbersReplacement: false })
    engine.setVocabulary(new Map([
      ['library', { japanese: '図書館', reading: 'としょかん' }]
    ]), new Set())

    const original = 'The library is quiet.'
    const result = engine.replace(original)

    expect(result.matches.length).toBe(1)
    const match = result.matches[0]
    expect(match.original.toLowerCase()).toBe('library')
    expect(match.replacement).toBe('図書館')
    expect(match.reading).toBe('としょかん')
  })
})
