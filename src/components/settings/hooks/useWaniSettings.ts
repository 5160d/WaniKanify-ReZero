import { useState, useEffect } from 'react';
import { Storage } from "@plasmohq/storage";
import { type WaniSettings } from '..';
import { DEFAULT_SETTINGS } from '../constants';

export const useWaniSettings = () => {
    const [settings, setSettings] = useState<WaniSettings>(DEFAULT_SETTINGS);
    const storage = new Storage();

    useEffect(() => {
        // Load settings from storage
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

    const updateSettings = async (newSettings: Partial<WaniSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        try {
            await storage.set('waniSettings', updated);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    };

    return { settings, updateSettings };
};