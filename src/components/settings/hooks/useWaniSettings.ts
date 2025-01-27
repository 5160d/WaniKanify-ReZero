/**
 * @fileoverview Hook for managing WaniKani settings state and storage
 * @author 5160d
 * @license GPL-3.0
 */

import { useState, useEffect } from 'react';
import { useStorage } from "@plasmohq/storage/hook"
import { Storage } from "@plasmohq/storage"
import { type WaniSettings, WaniSettingsFormImpl, waniSettingsSerializer, waniSettingsDeserializer } from '../types';
import { isDev } from 'src/components/common/constants';
import { DEFAULT_SETTINGS } from '../constants';
import equal from 'fast-deep-equal/es6/react';

/**
 * Creates a new settings form instance from WaniSettings
 * @param waniSettings - The source settings to initialize from
 * @returns A new WaniSettingsFormImpl instance
 */
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
    const [settingsForm, setSettingsForm] = useState<WaniSettingsFormImpl>(() => settingsToSettingsForm(savedSettings));
    // Track if form has modifications not yet saved
    const [isDirty, setIsDirty] = useState(false);

    // Sync form state with storage changes
    useEffect(() => {
        setSettingsForm(settingsToSettingsForm(savedSettings))
        setIsDirty(false);
    }, [savedSettings])

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
        setIsDirty(!equal(updated, settingsToSettingsForm(savedSettings)));
    };

    /**
     * Persists current settings to storage
     */
    const saveToStorage = () => {
        try {
            setSavedSettings(settingsForm.toWaniSettings());
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    };

    return {
        settingsForm,
        updateSettingsForm,
        saveToStorage,
        isDirty
    };
};