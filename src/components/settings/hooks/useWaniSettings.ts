/**
 * @fileoverview Hook for managing WaniKani settings state and storage
 * @author 5160d
 * @license GPL-3.0
 */

import { useState, useEffect, useRef } from 'react';
import { log } from '~src/utils/log'
import { useStorage } from "@plasmohq/storage/hook"
import { Storage } from "@plasmohq/storage"
import { type WaniSettings, WaniSettingsFormImpl, waniSettingsSerializer, waniSettingsDeserializer } from '../types';
import type { AudioMode } from '../toggles/types';
import { isDev } from 'src/components/common/constants';
import { DEFAULT_SETTINGS, SETTINGS_VERSION } from '../constants';
import { shouldBackfillSettings } from '../utils/backfill';
import equal from 'fast-deep-equal/es6/react';
import type { SaveStatus } from '../SaveButton/types';
import { SAVE_ERROR_KEY, SAVE_SUCCESS_KEY } from '../SaveButton/constants';

/**
 * Creates a new settings form instance from WaniSettings
 * @param waniSettings - The source settings to initialize from
 * @returns A new WaniSettingsFormImpl instance
 */
const applyDefaultStructure = (settings: WaniSettings | undefined): WaniSettings => {
    const base = DEFAULT_SETTINGS;
    const merged: WaniSettings = {
        version: settings?.version ?? SETTINGS_VERSION,
        apiToken: settings?.apiToken ?? base.apiToken,
        autoRun: settings?.autoRun ?? base.autoRun,
        audio: {
            ...base.audio,
            ...(settings?.audio ?? {})
        },
        showReplacementTooltips: settings?.showReplacementTooltips ?? base.showReplacementTooltips,
        numbersReplacement: settings?.numbersReplacement ?? base.numbersReplacement,
        performanceTelemetry: settings?.performanceTelemetry ?? base.performanceTelemetry,
        srsGroups: {
            ...base.srsGroups,
            ...(settings?.srsGroups ?? {})
        },
        customVocabulary: settings?.customVocabulary ?? new Map(base.customVocabulary),
        vocabularyBlacklist: settings?.vocabularyBlacklist ?? new Set(base.vocabularyBlacklist),
        sitesFiltering: settings?.sitesFiltering ?? [...base.sitesFiltering],
        spreadsheetImport: settings?.spreadsheetImport ?? [...base.spreadsheetImport],
        siteOverrides: settings?.siteOverrides ?? {}
    }

    const allowedModes: AudioMode[] = ['click', 'hover']
    if (!allowedModes.includes(merged.audio.mode as AudioMode)) {
        merged.audio.mode = 'click'
    }

    if (typeof merged.showReplacementTooltips !== 'boolean') {
        merged.showReplacementTooltips = base.showReplacementTooltips
    }

    if (typeof merged.performanceTelemetry !== 'boolean') {
        merged.performanceTelemetry = base.performanceTelemetry
    }
    Object.values(merged.siteOverrides ?? {}).forEach((override) => {
        if (!override?.audio) {
            return
        }

        if (!allowedModes.includes(override.audio.mode as AudioMode)) {
            override.audio.mode = 'click'
        }

        if (typeof override.showReplacementTooltips !== 'boolean') {
            delete override.showReplacementTooltips
        }
    })

    return merged
}

const settingsToSettingsForm = (waniSettings: WaniSettings) => {
    const settingsForm = new WaniSettingsFormImpl();
    settingsForm.setFromWaniSettings(waniSettings ?? DEFAULT_SETTINGS);
    return settingsForm;
};

/**
 * Custom hook for managing WaniKani settings state and persistence
 * @returns Settings management interface
 */
export const useWaniSettings = () => {
    // Avoid using Sync storage in dev mode
    const [savedSettings, setSavedSettings] = useStorage<WaniSettings>({
        key: "WaniSettings",
        instance: new Storage({
            area: isDev ? "local" : "sync",
            serde: {
                serializer: (value) => JSON.stringify(value, waniSettingsSerializer),
                deserializer: (text) => JSON.parse(text, waniSettingsDeserializer)
            }
        })
    });
    const normalizedSettings = applyDefaultStructure(savedSettings);
    const [settingsForm, setSettingsForm] = useState<WaniSettingsFormImpl>(() => settingsToSettingsForm(normalizedSettings));
    // Track if form has modifications not yet saved
    const [isDirty, setIsDirty] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>({ status: "idle", message: "" });
    // Tracks whether the most recent storage change originated from an explicit save action
    const pendingSaveRef = useRef(false)

    // Sync form state with storage changes
    useEffect(() => {
        const normalized = applyDefaultStructure(savedSettings)

        if (shouldBackfillSettings(savedSettings, normalized)) {
            setSavedSettings(normalized)
            return
        }

        // Only re-sync form from persisted storage when the storage itself changed
        setSettingsForm(settingsToSettingsForm(normalized))

        if (pendingSaveRef.current) {
            // Complete save lifecycle: mark success then quickly return to idle so button state resets
            setSaveStatus({ status: 'success', message: SAVE_SUCCESS_KEY })
            setTimeout(() => setSaveStatus({ status: 'idle', message: '' }), 30)
            pendingSaveRef.current = false
        }

        // After any storage change, the in-memory form now matches persisted state
        setIsDirty(false)
    }, [savedSettings, setSavedSettings])

    /**
     * Updates settings form with new values while preserving saved settings
     * @param newSettingsForm - Partial settings to update
     */
    const updateSettingsForm = (newSettingsForm: Partial<WaniSettingsFormImpl>) => {
        const updated = new WaniSettingsFormImpl();
        setSettingsForm(current => {
            Object.assign(updated, current, newSettingsForm);
            return updated;
        });
        // Handle when the user reverted to saved settings
        setIsDirty(!equal(updated, settingsToSettingsForm(applyDefaultStructure(savedSettings))));
    };

    /**
     * Persists current settings to storage
     */
    const saveToStorage = () => {
        try {
            pendingSaveRef.current = true
            setSaveStatus({ status: 'pending', message: '' })
            setSavedSettings(settingsForm.toWaniSettings())
        } catch (error) {
            pendingSaveRef.current = false
            setSaveStatus({ status: 'error', message: SAVE_ERROR_KEY })
            log.error('save to storage failed', error)
        }
    };

    const resetToDefaults = () => {
        setSavedSettings(DEFAULT_SETTINGS);
    };

    const applyImportedSettings = (settings: WaniSettings) => {
        setSavedSettings(applyDefaultStructure(settings));
    };

    const forceSyncFromCloud = async () => {
        try {
            const syncArea = isDev ? chrome.storage.local : chrome.storage.sync;
            const result = await new Promise<WaniSettings | undefined>((resolve) => {
                if (!syncArea || !syncArea.get) {
                    resolve(undefined);
                    return;
                }
                syncArea.get('WaniSettings', (items) => {
                    resolve(items?.WaniSettings as WaniSettings | undefined);
                });
            });
            if (result) {
                applyImportedSettings(result);
            }
        } catch (error) {
            log.error('force sync settings failed', error)
        }
    };

    return {
        settingsForm,
        updateSettingsForm,
        saveToStorage,
        resetToDefaults,
        applyImportedSettings,
        forceSyncFromCloud,
        isDirty,
        saveStatus
    };
};


