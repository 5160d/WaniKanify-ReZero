import { VocabularyManager } from '~src/services/vocabulary'
import type { WaniSettings } from '~src/components/settings/types'
import type { WaniKaniAssignment } from '~src/services/wanikani'
import { DEFAULT_SETTINGS } from '~src/components/settings/constants'

const buildSettings = (overrides: Partial<WaniSettings> = {}): WaniSettings => ({
  ...DEFAULT_SETTINGS,
  ...overrides,
  customVocabulary: overrides.customVocabulary ?? new Map(DEFAULT_SETTINGS.customVocabulary),
  vocabularyBlacklist: overrides.vocabularyBlacklist ?? new Set(DEFAULT_SETTINGS.vocabularyBlacklist),
  siteOverrides: overrides.siteOverrides ?? {},
  srsGroups: overrides.srsGroups ?? DEFAULT_SETTINGS.srsGroups,
  spreadsheetImport: overrides.spreadsheetImport ?? [],
  sitesFiltering: overrides.sitesFiltering ?? [],
  audio: overrides.audio ?? DEFAULT_SETTINGS.audio
})

describe('VocabularyManager', () => {
  const createSubject = (overrides: Partial<any> = {}) => ({
    id: 1,
    object: 'vocabulary',
    url: '',
    data_updated_at: '',
    data: {
      slug: 'cat',
      characters: '猫',
      meanings: [{ meaning: 'cat', primary: true, accepted_answer: true }],
      readings: [{ reading: 'ねこ', primary: true, accepted_answer: true }],
      pronunciation_audios: [],
      ...overrides.data
    },
    ...overrides
  })

  const createAssignment = (overrides: Partial<WaniKaniAssignment["data"]> = {}): WaniKaniAssignment => ({
    id: 1,
    object: 'assignment',
    data: {
      subject_id: 1,
      subject_type: 'vocabulary',
      srs_stage: 4,
      unlocked_at: null,
      available_at: null,
      passed_at: null,
      burned_at: null,
      ...overrides
    }
  })
  it('builds entries from custom vocabulary', () => {
    const settings = buildSettings({
      customVocabulary: new Map([
        ['quick fox', { japanese: '迅狐', reading: 'じんこ' }],
        ['fox', { japanese: '迅狐', reading: 'じんこ' }]
      ])
    })

    const manager = new VocabularyManager({
      settings,
      subjects: [],
      assignments: []
    })

    const { entries, lookupMap } = manager.build()

    expect(entries).toHaveLength(1)
    const entry = entries[0]
    expect(entry.source).toBe('custom')
    expect(entry.english).toEqual(['quick fox', 'fox'])
    expect(entry.japanese).toBe('迅狐')
    expect(entry.reading).toBe('じんこ')
    expect(lookupMap.get('quick fox')).toBe(entry)
    expect(lookupMap.get('fox')).toBe(entry)
  })

  it('includes imported vocabulary after filtering blacklisted words', () => {
    const settings = buildSettings({
      vocabularyBlacklist: new Set(['watch'])
    })

    const manager = new VocabularyManager({
      settings,
      subjects: [],
      assignments: []
    })

    manager.updateImportedVocabulary([
      {
        id: 'import:clock',
        english: ['clock', 'watch'],
        japanese: '時計',
        reading: 'とけい',
        source: 'imported',
        priority: 1,
        audioUrls: []
      }
    ])

    const { entries, lookupMap } = manager.build()
    expect(entries).toHaveLength(1)
    const entry = entries[0]
    expect(entry.source).toBe('imported')
    expect(entry.english).toEqual(['clock'])
    expect(lookupMap.get('clock')).toBe(entry)
    expect(lookupMap.get('watch')).toBeUndefined()
  })

  it('builds WaniKani vocabulary respecting SRS selection', () => {
    const settings = buildSettings({
      srsGroups: {
        apprentice: false,
        guru: true,
        master: false,
        enlightened: false,
        burned: false
      }
    })

    const subject = createSubject({
      id: 42,
      data: {
        slug: 'library',
        characters: '図書館',
        meanings: [{ meaning: 'library', primary: true, accepted_answer: true }],
        readings: [{ reading: 'としょかん', primary: true, accepted_answer: true }],
        pronunciation_audios: []
      }
    })

    const assignment = createAssignment({
      subject_id: 42,
      srs_stage: 5
    })

    const manager = new VocabularyManager({
      settings,
      subjects: [subject],
      assignments: [assignment]
    })

    const { entries, lookupMap } = manager.build()

    expect(entries).toHaveLength(1)
    const entry = lookupMap.get('library')
    expect(entry?.source).toBe('wanikani')
    expect(entry?.japanese).toBe('図書館')
    expect(entry?.reading).toBe('としょかん')
    expect(entry?.srsStage).toBe(5)
    expect(entry?.srsLevelLabel).toBe('guru')
  })

  it('excludes WaniKani vocabulary outside selected SRS groups', () => {
    const settings = buildSettings({
      srsGroups: {
        apprentice: false,
        guru: true,
        master: false,
        enlightened: false,
        burned: false
      }
    })

    const allowedSubject = createSubject({
      id: 101,
      data: {
        slug: 'allowed',
        characters: 'allowed-jp',
        meanings: [{ meaning: 'allowed', primary: true, accepted_answer: true }],
        readings: [{ reading: 'arashi', primary: true, accepted_answer: true }]
      }
    })

    const blockedSubject = createSubject({
      id: 102,
      data: {
        slug: 'blocked',
        characters: 'blocked-jp',
        meanings: [{ meaning: 'blocked', primary: true, accepted_answer: true }],
        readings: [{ reading: 'mukashi', primary: true, accepted_answer: true }]
      }
    })

    const manager = new VocabularyManager({
      settings,
      subjects: [allowedSubject, blockedSubject],
      assignments: [
        createAssignment({ subject_id: 101, srs_stage: 5 }),
        createAssignment({ subject_id: 102, srs_stage: 3 })
      ]
    })

    const { entries, lookupMap } = manager.build()

    expect(entries).toHaveLength(1)
    expect(lookupMap.get('allowed')).toBeDefined()
    expect(lookupMap.get('blocked')).toBeUndefined()
  })

  it('prioritizes custom vocabulary over imported and WaniKani entries', () => {
    const settings = buildSettings({
      customVocabulary: new Map([
        ['cat', { japanese: '猫', reading: 'ねこ' }]
      ])
    })

    const manager = new VocabularyManager({
      settings,
      subjects: [
        {
          id: 1,
          object: 'vocabulary',
          url: '',
          data_updated_at: '',
          data: {
            slug: 'cat',
            characters: '猫',
            meanings: [{ meaning: 'cat', primary: true, accepted_answer: true }],
            readings: [{ reading: 'びょう', primary: true, accepted_answer: true }]
          }
        }
      ],
      assignments: []
    })

    manager.updateImportedVocabulary([
      {
        id: 'import:cat',
        english: ['cat'],
        japanese: 'キャット',
        source: 'imported',
        priority: 1,
        audioUrls: []
      }
    ])

    const { lookupMap } = manager.build()
    const entry = lookupMap.get('cat')
    expect(entry?.japanese).toBe('猫')
    expect(entry?.source).toBe('custom')
  })
})
