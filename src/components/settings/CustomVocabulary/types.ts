export interface CustomVocabularyProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export interface VocabularyEntry {
    english: string[];
    japanese: string;
    reading?: string;
}