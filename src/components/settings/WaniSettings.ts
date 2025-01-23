import type { SpreadSheet } from 'src/components/settings/SpreadsheetImport/types';
import type { AudioMode } from '../common/types';

export interface WaniSettings {
    apiToken: string;
    autoRun: boolean;
    audio: {
        enabled: boolean;
        mode: AudioMode;
    };
    numbersReplacement: boolean;
    srsGroups: string[];
    customVocabulary: string;
    vocabularyBlacklist: string[];
    sitesFiltering: string[];
    spreadsheetImport: SpreadSheet[];
}