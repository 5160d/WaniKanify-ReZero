import { useCallback, useState } from 'react';
import { BLACKLIST_MAX_ENTRIES } from './constants';

/**
 * Hook to parse and validate blacklist entries.
 * - Splits on semicolons
 * - Filters out empty tokens
 * - De-duplicates via Set
 * - Enforces soft cap providing an error message when exceeded
 */
export const useParseBlacklist = () => {
    const [error, setError] = useState('');

    const parse = useCallback((raw: string): Set<string> => {
        if (!raw) {
            setError('');
            return new Set();
        }

        // Split and normalize tokens (trim whitespace, ignore empties)
        const tokens = raw.split(';')
            .map(t => t.trim())
            .filter(Boolean);

        const unique = new Set(tokens);

        if (!unique.size) {
            setError('Invalid list');
            return unique;
        }

        if (unique.size > BLACKLIST_MAX_ENTRIES) {
            setError(`Too many entries: ${unique.size} / ${BLACKLIST_MAX_ENTRIES}`);
        } else {
            setError('');
        }

        return unique;
    }, []);

    return { parse, error };
};
