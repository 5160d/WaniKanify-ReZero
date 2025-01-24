import { useCallback, useState } from "react";
import type { CustomVocabularyMap } from "../types";
import { parseCustomVocabulary } from './utils';

export const useToCustomVocabularyMap = () => {
    const [error, setError] = useState<string>('');

    const entryParse = useCallback((input: string): CustomVocabularyMap => {
        if (!input)
        {
            setError('');
            return new Map();
        }

        const vocabularyMap = parseCustomVocabulary(input);

        if (vocabularyMap.size === 0) {
            setError('Invalid entry format');
            return new Map();
        }

        setError('');
        return vocabularyMap;
    }, []);

    return { entryParse, error };
};