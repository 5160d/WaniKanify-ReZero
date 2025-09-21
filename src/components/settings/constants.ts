import type { WaniSettings, WaniSettingsFormErrors, CustomVocabularyMap, SrsGroupsObject } from './types';
import { SETTINGS_VERSION } from './version';

export { SETTINGS_VERSION } from './version';

export const DEFAULT_SETTINGS: WaniSettings = {
    version: SETTINGS_VERSION,
    autoRun: false,
    audio: { enabled: false, mode: 'click', volume: 1 },
    showReplacementTooltips: true,
    numbersReplacement: false,
    performanceTelemetry: false,
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
    sitesFiltering: [],
    siteOverrides: {}
};

export const DEFAULT_SETTINGS_FORM_ERRORS: WaniSettingsFormErrors = {
    apiToken: false,
    customVocabulary: false
}
