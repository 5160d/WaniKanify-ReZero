import type { SpreadSheet } from 'src/components/settings/SpreadsheetImport/types';
import type { AudioMode } from './toggles/types';
import { parseCustomVocabulary } from './CustomVocabulary/utils';

export type CustomVocabularyMap = Map<string, { japanese: string, reading: string }>;
export type SrsGroupsObject = { apprentice: boolean, guru: boolean, master: boolean, enlightened: boolean, burned: boolean };

export interface WaniSettings {
    apiToken: string;
    autoRun: boolean;
    audio: {
        enabled: boolean;
        mode: AudioMode;
    };
    numbersReplacement: boolean;
    srsGroups: SrsGroupsObject;
    customVocabulary: CustomVocabularyMap;
    vocabularyBlacklist: Set<string>;
    sitesFiltering: string[];
    spreadsheetImport: SpreadSheet[];
}

// functions to serialize and deserialize WaniSettings
export function waniSettingsSerializer(key: string, value: any): any {
    if (key === "customVocabulary") {
        // Convert a Map into an object with a _type marker
        return {
            _type: "customVocabulary",
            object: Array.from(value)
        }
    }
    if (key === "vocabularyBlacklist") {
        // Convert a Set into an object with a _type marker
        return {
            _type: "vocabularyBlacklist",
            object: Array.from(value)
        }
    }
    return value
}

export function waniSettingsDeserializer(key: string, value: any): any {
    // Handle Maps
    if (value && value._type === "customVocabulary") {
        return new Map(value.object) as CustomVocabularyMap
    }
    // Handle Sets
    if (value && value._type === "vocabularyBlacklist") {
        return new Set<string>(value.object)
    }
    return value
}

export interface WaniSettingsForm {
    apiToken: string;
    autoRun: boolean;
    audio: {
        enabled: boolean;
        mode: AudioMode;
    };
    numbersReplacement: boolean;
    srsGroups: SrsGroupsObject;
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
    srsGroups: SrsGroupsObject;
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
        if (!customVocabulary?.size) return "";

        const japaneseMap = new Map<string, { eng: string[], reading: string }>();

        Array.from(customVocabulary).forEach(([eng, data]) => {
            const { japanese, reading } = data;
            if (japaneseMap.has(japanese)) {
                japaneseMap.get(japanese)!.eng.push(eng);
            } else {
                japaneseMap.set(japanese, { eng: [eng], reading });
            }
        });

        return Array.from(japaneseMap)
            .map(([japanese, { eng, reading }]) => `${eng.join(',')}:${japanese}${reading ? ':' + reading : ''}`)
            .join(';');
    }

    private _vocabularyBlacklistStringify(vocabularyBlacklist: Set<string>): string {
        if (!vocabularyBlacklist?.size) {
            return '';
        }

        return Array.from(vocabularyBlacklist).join(';');
    }

    private _vocabularyBlacklistParse(vocabularyBlacklist: string): Set<string> {
        if (!vocabularyBlacklist.trim()) {
            return new Set();
        }

        return new Set(vocabularyBlacklist.split(';').filter(Boolean));
    }
}

export interface WaniSettingsFormErrors {
    apiToken: boolean;
    customVocabulary: boolean;
}