import type { CustomVocabularyMap } from "../types";

const isFurigana = (text: string): boolean => {
    // Matches hiragana and katakana
    const furiganaPattern = /^[\u3040-\u309F\u30A0-\u30FF]+$/;
    return furiganaPattern.test(text.trim());
};

export const parseCustomVocabulary = (input: string): CustomVocabularyMap => {
    if (!input?.trim()) return new Map();

    return input
        .split(';')
        .filter(Boolean)
        .reduce((map, entry) => {
            const [eng, jp, reading = ''] = entry.split(':').filter(Boolean);
            
            if (!eng || !jp || (reading && !isFurigana(reading))) {
                map.clear();
                return map;
            }

            eng.split(',')
                .filter(Boolean)
                .forEach(word => map.set(word.trim(), { 
                    japanese: jp.trim(), 
                    reading: reading.trim() 
                }));

            return map;
        }, new Map() as CustomVocabularyMap);
};