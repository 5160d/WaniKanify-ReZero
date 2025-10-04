import { FastAhoCorasickReplacer } from "~src/services/fastAhoCorasickReplacer"

describe('FastAhoCorasickReplacer Unified Architecture', () => {
  let replacer: FastAhoCorasickReplacer

  beforeEach(() => {
    replacer = new FastAhoCorasickReplacer()
    replacer.updateConfig({
      caseSensitive: false,
      numbersReplacement: true,
      matchWholeWord: true
    })
  })

  test('handles vocabulary setup and replacement', () => {
    const vocabulary = new Map([
      ['fox', { japanese: '狐', reading: 'きつね' }],
      ['cat', { japanese: '猫', reading: 'ねこ' }]
    ])
    const blacklist = new Set<string>()

    replacer.setVocabulary(vocabulary, blacklist, false)

    // Test text replacement
    const result = replacer.replace('The fox and cat are animals.')
    expect(result.changed).toBe(true)
    expect(result.value).toBe('The 狐 and 猫 are animals.')
    expect(result.matches).toHaveLength(2)
    expect(result.matches[0].original).toBe('fox')
    expect(result.matches[0].replacement).toBe('狐')
    expect(result.matches[0].reading).toBe('きつね')
  })

  test('handles node replacement with container creation', () => {
    const vocabulary = new Map([
      ['test', { japanese: 'テスト', reading: 'てすと' }]
    ])
    replacer.setVocabulary(vocabulary, new Set(), false)

    // Create a text node
    const textNode = document.createTextNode('This is a test sentence.')
    
    const result = replacer.replaceNode(textNode)
    expect(result.changed).toBe(true)
    expect(result.matches).toHaveLength(1)
    
    // Verify tracking
    expect(replacer.getTrackedNodesCount()).toBe(1)
  })

  test('handles numbers replacement', () => {
    replacer.updateConfig({ numbersReplacement: true })
    
    const result = replacer.replace('I have 123 items.')
    expect(result.changed).toBe(true)
    expect(result.value).toBe('I have 一二三 items.')
  })

  test('respects blacklist', () => {
    const vocabulary = new Map([
      ['fox', { japanese: '狐', reading: 'きつね' }],
      ['cat', { japanese: '猫', reading: 'ねこ' }]
    ])
    const blacklist = new Set(['fox'])

    replacer.setVocabulary(vocabulary, blacklist, false)

    const result = replacer.replace('The fox and cat are animals.')
    expect(result.changed).toBe(true)
    expect(result.value).toBe('The fox and 猫 are animals.')
    expect(result.matches).toHaveLength(1) // Only cat should be replaced
  })

  test('can revert all changes', () => {
    const vocabulary = new Map([
      ['test', { japanese: 'テスト', reading: 'てすと' }]
    ])
    replacer.setVocabulary(vocabulary, new Set(), false)

    // Create and replace multiple nodes
    const node1 = document.createTextNode('First test node.')
    const node2 = document.createTextNode('Second test node.')
    
    replacer.replaceNode(node1)
    replacer.replaceNode(node2)
    
    expect(replacer.getTrackedNodesCount()).toBe(2)
    
    // Revert all
    replacer.revertAll()
    expect(replacer.getTrackedNodesCount()).toBe(0)
    expect(node1.data).toBe('First test node.') // Should be reverted
  })

  test('handles element-wide replacement for batch processing', () => {
    const vocabulary = new Map([
      ['hello', { japanese: 'こんにちは', reading: 'こんにちは' }],
      ['world', { japanese: '世界', reading: 'せかい' }]
    ])
    replacer.setVocabulary(vocabulary, new Set(), false)

    // Create a container with multiple text nodes
    const container = document.createElement('div')
    container.innerHTML = 'hello <span>world</span> hello again'
    
    // This simulates batch processing for light pages
    replacer.replaceTextNodesInElement(container)
    
    // Check that replacements were made
    const replacementSpans = container.querySelectorAll('.wanikanify-replacement')
    expect(replacementSpans.length).toBeGreaterThan(0)
  })
})