import { useState, useEffect } from 'react';
import { Storage } from "@plasmohq/storage";
import { type WaniSettings } from '..';

import { isDev } from 'src/components/common/constants';
import { DEFAULT_SETTINGS } from '../constants';

export const useWaniSettings = () => {
    const [settings, setSettings] = useState<WaniSettings>(DEFAULT_SETTINGS);
    const [isDirty, setIsDirty] = useState(false);
    const storage = isDev ? new Storage({ area: "local" }) : new Storage();

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const stored = await storage.get('waniSettings');
                if (stored) {
                    setSettings(JSON.parse(stored));
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        };
        loadSettings();
    }, []);

    const updateSettings = (newSettings: Partial<WaniSettings>) => {
        setSettings(current => ({ ...current, ...newSettings }));
        setIsDirty(true);
    };

    const saveToStorage = async () => {
        try {
            await storage.set('waniSettings', settings);
            setIsDirty(false);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    };

    return { 
        settings, 
        updateSettings, 
        saveToStorage,
        isDirty 
    };
};