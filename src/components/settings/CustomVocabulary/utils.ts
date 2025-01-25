/**
 * @fileoverview Utility functions for custom vocabulary parsing and validation
 * @module CustomVocabulary/utils
 * @author 5160d
 * @license GPL-3.0
 */

import type { CustomVocabularyMap } from "../types";

/**
 * Checks if text contains only Japanese furigana characters
 * @param text - Input text to validate
 * @returns True if text contains only hiragana/katakana
 */
const isFurigana = (text: string): boolean => {
    const furiganaPattern = /^[\u3040-\u309F\u30A0-\u30FF]+$/;
    return furiganaPattern.test(text.trim());
};

/**
 * Parses string input into CustomVocabularyMap
 * Format: "eng1,eng2:japanese:reading;eng3:japanese2:reading2"
 * Reading is optional and only used for audio
 * @param input - Raw string containing vocabulary entries
 * @returns Map of English terms to Japanese translations
 */
export const parseCustomVocabulary = (input: string): CustomVocabularyMap => {
    if (!input?.trim()) return new Map();

    return input
        .split(';')                    // Split entries
        .filter(Boolean)               // Remove empty entries
        .reduce((map, entry) => {
            // Parse components
            const [eng, jp, reading = ''] = entry.split(':').filter(Boolean);
            
            // Validate entry format
            if (!eng || !jp || (reading && !isFurigana(reading))) {
                map.clear();
                return map;
            }

            /**
             * Add all English variants
             * Simple method that duplicates Japanese/reading for each English term
             **/ 
            eng.split(',')
                .filter(Boolean)
                .forEach(word => map.set(word.trim(), { 
                    japanese: jp.trim(), 
                    reading: reading.trim() 
                }));

            return map;
        }, new Map() as CustomVocabularyMap);
};