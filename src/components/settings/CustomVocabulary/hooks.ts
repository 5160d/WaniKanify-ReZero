import { useState, useCallback } from 'react';
import type { VocabularyEntry } from './types';

export const useVocabularyValidation = () => {
    const [error, setError] = useState<string>('');

    const validateEntry = useCallback((input: string): VocabularyEntry[] | null => {
        try {
            return input.split(':').map(entry => {
                const [eng, jp, reading] = entry.split(';');
                if (!eng || !jp) throw new Error('Invalid format');
                return {
                    english: eng.split(','),
                    japanese: jp,
                    reading: reading
                };
            });
        } catch {
            setError('Failed to parse vocabulary format');
            return null;
        }
    }, []);

    return { validateEntry, error, setError };
};