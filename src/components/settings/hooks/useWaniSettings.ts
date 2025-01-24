import { useState, useEffect } from 'react';
import { Storage } from "@plasmohq/storage";
import { type WaniSettings, type WaniSettingsForm, WaniSettingsFormImpl } from '../types';

import { isDev } from 'src/components/common/constants';
import { DEFAULT_SETTINGS } from '../constants';

const createDefaultSettings = () => {
    const settingsForm = new WaniSettingsFormImpl();
    settingsForm.setFromWaniSettings(DEFAULT_SETTINGS);
    return settingsForm;
};

export const useWaniSettings = () => {
    const [settings, setSettings] = useState<WaniSettings>(DEFAULT_SETTINGS);
    const [settingsForm, setSettingsForm] = useState<WaniSettingsFormImpl>(createDefaultSettings);
    const [isDirty, setIsDirty] = useState(false);
    const storage = isDev ? new Storage({ area: "local" }) : new Storage();

    useEffect(() => {
    const loadSettingsFromStorage = async () => {
        try {
            const stored = await storage.get('waniSettings');
            if (stored) {
                const newSettings = JSON.parse(stored);
                const newFormSettings = new WaniSettingsFormImpl();
                newFormSettings.setFromWaniSettings(newSettings);

                    setSettings(newSettings);
                    setSettingsForm(newFormSettings);
            }
            } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };
        loadSettingsFromStorage();
    }, []);

    const updateSettingsForm = (newSettingsForm: Partial<WaniSettingsFormImpl>) => {

        setSettingsForm(current => {
            const updated = new WaniSettingsFormImpl();
            Object.assign(updated, current, newSettingsForm);
            return updated;
        });
        setIsDirty(true);
    };

    const saveToStorage = async () => {
        const newSettings = settingsForm.toWaniSettings();
        
        try {
            setSettings(newSettings);
            await storage.set('waniSettings', JSON.stringify(newSettings));
            setIsDirty(false);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    };

    return {
        settings,
        settingsForm,
        updateSettingsForm,
        saveToStorage,
        isDirty
    };
};