import type { SpreadSheet } from 'src/components/settings/SpreadsheetImport/types';
import type { AudioMode } from './toggles/types';
import { parseCustomVocabulary } from './CustomVocabulary/utils';
import { SETTINGS_VERSION } from './version';

export type CustomVocabularyMap = Map<string, { japanese: string, reading?: string }>;
export type SrsGroupsObject = { apprentice: boolean, guru: boolean, master: boolean, enlightened: boolean, burned: boolean };

export interface WaniSettings {
    version: number;
    apiToken: string;
    autoRun: boolean;
    audio: {
        enabled: boolean;
        mode: AudioMode;
        volume: number;
    };
    showReplacementTooltips: boolean;
    numbersReplacement: boolean;
    performanceTelemetry: boolean;
    srsGroups: SrsGroupsObject;
    customVocabulary: CustomVocabularyMap;
    vocabularyBlacklist: Set<string>;
    sitesFiltering: string[];
    spreadsheetImport: SpreadSheet[];
    siteOverrides: Record<string, SiteOverrideSettings>;
}

export type SiteOverrideSettings = Partial<{
    autoRun: boolean;
    numbersReplacement: boolean;
    audio: {
        enabled: boolean;
        mode: AudioMode;
        volume: number;
    };
    srsGroups: SrsGroupsObject;
    showReplacementTooltips: boolean;
}>;

// functions to serialize and deserialize WaniSettings
// Internal sentinel identifiers used only for JSON round‑tripping; not user‑visible UI strings.
// Internal sentinel constants (not user-visible UI text)
const __WK_SENTINEL_CUSTOM_VOCAB = '__customVocabulary__'
const __WK_SENTINEL_VOCAB_BLACKLIST = '__vocabularyBlacklist__'

export function waniSettingsSerializer(key: string, value: unknown): unknown {
    if (key === 'customVocabulary' && value instanceof Map) {
        return {
            _type: __WK_SENTINEL_CUSTOM_VOCAB,
            object: Array.from(value.entries())
        }
    }
    if (key === 'vocabularyBlacklist' && value instanceof Set) {
        return {
            _type: __WK_SENTINEL_VOCAB_BLACKLIST,
            object: Array.from(value.values())
        }
    }
    return value
}

export function waniSettingsDeserializer(_key: string, value: unknown): unknown {
    if (value && typeof value === 'object') {
        const v = value as { _type?: string, object?: unknown }
        if (v._type === __WK_SENTINEL_CUSTOM_VOCAB && Array.isArray(v.object)) {
            return new Map(v.object as [string, { japanese: string; reading?: string }][]) as CustomVocabularyMap
        }
        if (v._type === __WK_SENTINEL_VOCAB_BLACKLIST && Array.isArray(v.object)) {
            return new Set<string>(v.object as string[])
        }
    }
    return value
}

export interface WaniSettingsForm {
    apiToken: string;
    autoRun: boolean;
    audio: {
        enabled: boolean;
        mode: AudioMode;
        volume: number;
    };
    showReplacementTooltips: boolean;
    numbersReplacement: boolean;
    performanceTelemetry: boolean;
    srsGroups: SrsGroupsObject;
    customVocabulary: string;
    vocabularyBlacklist: string;
    sitesFiltering: string[];
    spreadsheetImport: SpreadSheet[];
    siteOverrides: Record<string, SiteOverrideSettings>;

    // Add utility methods
    setFromWaniSettings(waniSettings: WaniSettings): void;
    toWaniSettings(): WaniSettings;
}

// Create a class to implement WaniSettings
export class WaniSettingsFormImpl implements WaniSettingsForm {
    version: number;
    apiToken: string;
    autoRun: boolean;
    audio: {
        enabled: boolean;
        mode: AudioMode;
        volume: number;
    };
    showReplacementTooltips: boolean;
    numbersReplacement: boolean;
    performanceTelemetry: boolean;
    srsGroups: SrsGroupsObject;
    customVocabulary: string;
    vocabularyBlacklist: string;
    sitesFiltering: string[];
    spreadsheetImport: SpreadSheet[];
    siteOverrides: Record<string, SiteOverrideSettings>;

    setFromWaniSettings(waniSettings: WaniSettings): void {
        this.apiToken = waniSettings.apiToken;
        this.autoRun = waniSettings.autoRun;
        this.audio = waniSettings.audio;
        this.showReplacementTooltips = waniSettings.showReplacementTooltips;
        this.numbersReplacement = waniSettings.numbersReplacement;
        this.performanceTelemetry = Boolean(waniSettings.performanceTelemetry);
        this.srsGroups = waniSettings.srsGroups;
        this.customVocabulary = this._customVocabularyStringify(waniSettings.customVocabulary);
        this.vocabularyBlacklist = this._vocabularyBlacklistStringify(waniSettings.vocabularyBlacklist);
        this.sitesFiltering = waniSettings.sitesFiltering;
        this.spreadsheetImport = waniSettings.spreadsheetImport;
        this.siteOverrides = waniSettings.siteOverrides ?? {};
        this.version = waniSettings.version ?? SETTINGS_VERSION;
    }

    toWaniSettings(): WaniSettings {

        return {
            apiToken: this.apiToken,
            autoRun: this.autoRun,
            audio: this.audio,
            showReplacementTooltips: this.showReplacementTooltips,
            numbersReplacement: this.numbersReplacement,
            performanceTelemetry: this.performanceTelemetry,
            srsGroups: this.srsGroups,
            customVocabulary: parseCustomVocabulary(this.customVocabulary),
            vocabularyBlacklist: this._vocabularyBlacklistParse(this.vocabularyBlacklist),
            sitesFiltering: this.sitesFiltering,
            spreadsheetImport: this.spreadsheetImport,
            siteOverrides: this.siteOverrides ?? {},
            version: SETTINGS_VERSION
        };
    }

    private _customVocabularyStringify(customVocabulary: CustomVocabularyMap): string {
        if (!customVocabulary?.size) return "";

        const japaneseMap = new Map<string, { eng: string[], reading?: string }>();

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
    vocabularyBlacklist: boolean;
}
