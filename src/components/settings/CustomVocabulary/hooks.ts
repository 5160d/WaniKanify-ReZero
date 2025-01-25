/**
 * @fileoverview Custom hooks for managing vocabulary map parsing and validation
 * @module CustomVocabulary/hooks
 * @author 5160d
 * @license GPL-3.0
 */

import { useCallback, useState } from "react";
import type { CustomVocabularyMap } from "../types";
import { parseCustomVocabulary } from './utils';

/**
 * Hook for parsing and validating custom vocabulary entries
 * @returns {Object} Parsing function and error state
 */
export const useToCustomVocabularyMap = () => {
    // Track parsing error state
    const [error, setError] = useState<string>('');

    /**
     * Parses input string into vocabulary map
     * @param input - Raw vocabulary entry string
     * @returns Parsed vocabulary map or empty map on failure
     */
    const entryParse = useCallback((input: string): CustomVocabularyMap => {
        // Handle empty input case
        if (!input) {
            setError('');
            return new Map();
        }

        // Attempt to parse vocabulary entries
        const vocabularyMap = parseCustomVocabulary(input);

        // Validate parsing result
        if (!vocabularyMap.size) {
            setError('Invalid entry format');
            return new Map();
        }

        setError('');
        return vocabularyMap;
    }, []);

    return { entryParse, error };
};