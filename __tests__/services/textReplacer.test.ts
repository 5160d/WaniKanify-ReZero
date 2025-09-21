import { TextReplacementEngine } from '~src/services/textReplacer'

const flushTimers = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('TextReplacementEngine', () => {
  it('replaces matched vocabulary while preserving other text', async () => {
    const engine = new TextReplacementEngine()
    const vocabulary = new Map<string, { japanese: string; reading?: string }>([
      ['fox', { japanese: 'FOX_JP', reading: 'kitsune' }],
      ['dog', { japanese: 'DOG_JP', reading: 'inu' }]
    ])

    engine.setVocabulary(vocabulary, new Set())
    engine.updateConfig({ matchWholeWord: true, numbersReplacement: false })

    await flushTimers()

    const input = 'The quick brown fox jumps over the lazy dog.'
    const result = engine.replace(input)

    expect(result.value).toContain('FOX_JP')
    expect(result.value).toContain('DOG_JP')
    expect(result.changed).toBe(true)
    expect(result.matches).toHaveLength(2)
  })

  it('prefers longer matches when words overlap', async () => {
    const engine = new TextReplacementEngine()

    engine.setVocabulary(
      new Map([
        ['cat', { japanese: 'NEKO' }],
        ['cater', { japanese: 'CATER' }],
        ['caterpillar', { japanese: 'CATERPILLAR' }]
      ]),
      new Set()
    )
    engine.updateConfig({ matchWholeWord: false })

    await flushTimers()

    const result = engine.replace('The caterpillar met another cat and a cater.')

    expect(result.value).toBe('The CATERPILLAR met another NEKO and a CATER.')
    expect(result.matches.map((match) => match.replacement)).toEqual([
      'CATERPILLAR',
      'NEKO',
      'CATER'
    ])
  })

  it('respects case sensitivity and whole word settings', async () => {
    const engine = new TextReplacementEngine()
    engine.setVocabulary(new Map([['Java', { japanese: 'JAVA_JP' }]]), new Set())

    engine.updateConfig({ caseSensitive: false, matchWholeWord: true })
    await flushTimers()
    expect(engine.replace('I like JavaScript and JAVA.').value).toBe(
      'I like JavaScript and JAVA_JP.'
    )

    engine.updateConfig({ caseSensitive: true })
    await flushTimers()
    expect(engine.replace('I like JavaScript and JAVA.').value).toBe(
      'I like JavaScript and JAVA.'
    )

    engine.updateConfig({ caseSensitive: false, matchWholeWord: true })
    await flushTimers()
    expect(engine.replace('Java-based tools are useful.').value).toBe(
      'Java-based tools are useful.'
    )
  })

  it('honours pattern overrides alongside automaton matches', async () => {
    const engine = new TextReplacementEngine()
    const vocab = new Map([
      ['email', { japanese: 'EMAIL_JP' }],
      ['@user', { japanese: 'USER_JP', reading: 'yuuzaa' }]
    ])

    engine.setVocabulary(vocab, new Set())
    engine.updateConfig({
      patternOverrides: new Map([
        ['@user', /@\w+/gu]
      ])
    })

    await flushTimers()

    const result = engine.replace('Contact email: hello@example.com for @user42')

    expect(result.value).toContain('EMAIL_JP')
    expect(result.value).toContain('USER_JP')
    expect(result.matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'email', replacement: 'EMAIL_JP' }),
        expect.objectContaining({ source: '@user', replacement: 'USER_JP' })
      ])
    )
  })

  it('returns structured replacement details for tooltip integration', async () => {
    const engine = new TextReplacementEngine()
    engine.setVocabulary(
      new Map([
        ['fox', { japanese: 'fox_jp', reading: 'kitsune' }]
      ]),
      new Set()
    )
    await flushTimers()

    const result = engine.replace('The sly fox watched.')

    expect(result.matches).toEqual([
      {
        original: 'fox',
        replacement: 'fox_jp',
        source: 'fox',
        reading: 'kitsune'
      }
    ])
  })

  it('converts numbers to Japanese numerals when enabled', async () => {
    const engine = new TextReplacementEngine()
    engine.setVocabulary(new Map(), new Set())
    engine.updateConfig({ numbersReplacement: true })

    await flushTimers()

    const result = engine.replace('There are 123 apples.')
    expect(result.value).toBe('There are \u4e00\u4e8c\u4e09 apples.')
    expect(result.changed).toBe(true)
  })

  it('handles large inputs within acceptable time', async () => {
    const engine = new TextReplacementEngine()
    const vocab = new Map<string, { japanese: string; reading?: string }>()
    for (let i = 0; i < 100; i += 1) {
      vocab.set(`word${i}`, { japanese: `JP${i}`, reading: '' })
    }
    engine.setVocabulary(vocab, new Set())
    await flushTimers()

    const text = new Array(500).fill(null).map((_, idx) => `word${idx % 100}`).join(' ')
    const start = performance.now()
    const result = engine.replace(text)
    const duration = performance.now() - start

    expect(result.changed).toBe(true)
    expect(duration).toBeLessThan(50)
  })

  it('caps replace duration for 5k vocabulary entries', async () => {
    const engine = new TextReplacementEngine()
    const vocab = new Map<string, { japanese: string; reading?: string }>()
    for (let i = 0; i < 5000; i += 1) {
      vocab.set(`bulk${i}`, { japanese: `JP${i}` })
    }
    engine.setVocabulary(vocab, new Set())
    engine.updateConfig({ matchWholeWord: true })

    await flushTimers()

    const text = new Array(400)
      .fill(null)
      .map((_, idx) => `bulk${idx % 5000}`)
      .join(' ')
    const start = performance.now()
    engine.replace(text)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(1000)
  })
})
