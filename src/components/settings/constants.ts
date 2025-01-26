import { type WaniSettings, type WaniSettingsFormErrors, type CustomVocabularyMap } from './types';


export const DEFAULT_SETTINGS: WaniSettings = {
    autoRun: false,
    audio: { enabled: false, mode: 'click' },
    numbersReplacement: false,
    srsGroups: ['apprentice', 'guru', 'master', 'enlightened', 'burned'],
    customVocabulary: new Map(),
    vocabularyBlacklist: new Set<string>(),
    spreadsheetImport: [],
    apiToken: '',
    sitesFiltering: []
};

export const DEFAULT_SETTINGS_FORM_ERRORS: WaniSettingsFormErrors = {
    apiToken: false,
    autoRun: false,
    customVocabulary: false
}