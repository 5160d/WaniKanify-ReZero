export interface VocabularyBlacklistProps {
    value: string;
    onChange: (value: string) => void;
    onValidate?: (isValid: boolean) => void;
}

export interface ValidationStatus {
    isValid: boolean;
    message: string;
    type: 'error' | 'success' | 'none';
}