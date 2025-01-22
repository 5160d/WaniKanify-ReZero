import type { WaniSettings } from '.';

export const DEFAULT_SETTINGS: WaniSettings = {
    autoRun: false,
    audio: { enabled: false, mode: 'click' },
    numbersReplacement: false,
    srsGroups: ['apprentice', 'guru', 'master', 'enlightened', 'burned'],
    customVocabulary: '',
    vocabularyBlacklist: [],
    spreadsheetImport: [],
    apiToken: '',
    sitesFiltering: []
};