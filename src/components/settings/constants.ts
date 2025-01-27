import type { WaniSettings, WaniSettingsFormErrors, CustomVocabularyMap, SrsGroupsObject } from './types';


export const DEFAULT_SETTINGS: WaniSettings = {
    autoRun: false,
    audio: { enabled: false, mode: 'click' },
    numbersReplacement: false,
    srsGroups: { 
        apprentice: true, 
        guru: true, 
        master: true, 
        enlightened: true, 
        burned: true 
    } as SrsGroupsObject,
    customVocabulary: new Map() as CustomVocabularyMap,
    vocabularyBlacklist: new Set<string>(),
    spreadsheetImport: [],
    apiToken: '',
    sitesFiltering: []
};

export const DEFAULT_SETTINGS_FORM_ERRORS: WaniSettingsFormErrors = {
    apiToken: false,
    customVocabulary: false
}