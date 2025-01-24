import type { SpreadSheet } from 'src/components/settings/SpreadsheetImport/types';
import type { AudioMode } from './toggles/types';
import { parseCustomVocabulary } from './CustomVocabulary/utils';

export type CustomVocabularyMap = Map<string, { japanese: string, reading: string }>;

export interface WaniSettings {
    apiToken: string;
    autoRun: boolean;
    audio: {
        enabled: boolean;
        mode: AudioMode;
    };
    numbersReplacement: boolean;
    srsGroups: string[];
    customVocabulary: CustomVocabularyMap;
    vocabularyBlacklist: Set<string>;
    sitesFiltering: string[];
    spreadsheetImport: SpreadSheet[];
}

export interface WaniSettingsForm {
    apiToken: string;
    autoRun: boolean;
    audio: {
        enabled: boolean;
        mode: AudioMode;
    };
    numbersReplacement: boolean;
    srsGroups: string[];
    customVocabulary: string;
    vocabularyBlacklist: string;
    sitesFiltering: string[];
    spreadsheetImport: SpreadSheet[];

    // Add utility methods
    setFromWaniSettings(waniSettings: WaniSettings): void;
    toWaniSettings(): WaniSettings;
}

// Create a class to implement WaniSettings
export class WaniSettingsFormImpl implements WaniSettingsForm {
    apiToken: string;
    autoRun: boolean;
    audio: {
        enabled: boolean;
        mode: AudioMode;
    };
    numbersReplacement: boolean;
    srsGroups: string[];
    customVocabulary: string;
    vocabularyBlacklist: string;
    sitesFiltering: string[];
    spreadsheetImport: SpreadSheet[];

    setFromWaniSettings(waniSettings: WaniSettings): void {
        this.apiToken = waniSettings.apiToken;
        this.autoRun = waniSettings.autoRun;
        this.audio = waniSettings.audio;
        this.numbersReplacement = waniSettings.numbersReplacement;
        this.srsGroups = waniSettings.srsGroups;
        this.customVocabulary = this._customVocabularyStringify(waniSettings.customVocabulary);
        this.vocabularyBlacklist = this._vocabularyBlacklistStringify(waniSettings.vocabularyBlacklist);
        this.sitesFiltering = waniSettings.sitesFiltering;
        this.spreadsheetImport = waniSettings.spreadsheetImport;
    }

    toWaniSettings(): WaniSettings {

        return {
            apiToken: this.apiToken,
            autoRun: this.autoRun,
            audio: this.audio,
            numbersReplacement: this.numbersReplacement,
            srsGroups: this.srsGroups,
            customVocabulary: parseCustomVocabulary(this.customVocabulary),
            vocabularyBlacklist: this._vocabularyBlacklistParse(this.vocabularyBlacklist),
            sitesFiltering: this.sitesFiltering,
            spreadsheetImport: this.spreadsheetImport
        };
    }

    private _customVocabularyStringify(customVocabulary: CustomVocabularyMap): string {

        let japaneseMap = new Map<string, { eng: string[], reading: string }>();

        customVocabulary.entries().forEach(([eng, { japanese, reading }]) => {
            if (japaneseMap.has(japanese)) {
                japaneseMap.get(japanese).eng.push(eng);
            } else {
                japaneseMap.set(japanese, { eng: [eng], reading });
            }
        });

        return Array.from(japaneseMap.entries())
            .map(([japanese, { eng, reading }]) => `${eng.join(',')}:${japanese}:${reading}`)
            .join(';');
    }

    private _vocabularyBlacklistStringify(vocabularyBlacklist: Set<string>): string {
        return Array.from(vocabularyBlacklist).join(';');
    }

    private _vocabularyBlacklistParse(vocabularyBlacklist: string): Set<string> {
        return new Set(vocabularyBlacklist.split(';').filter(Boolean));
    }
}

export interface WaniSettingsFormErrors {
    apiToken: boolean;
    autoRun: boolean;
    customVocabulary: boolean;
}