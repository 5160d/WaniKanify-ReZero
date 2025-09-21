export const EXAMPLES = {
    FORMAT: 'eng1,eng2,...:vocab:reading',
    ENTRY: 'cat,feline:猫:ねこ',
    MULTIPLE: 'cat,feline:猫:ねこ;cold:寒い:さむい'
};

export const HELP_TEXT = {
    TITLE: 'Custom Vocabulary',
    DESCRIPTION: 'This overrides Wanikani vocab.',
    FORMAT_LABEL: 'Format:',
    EXAMPLE_LABEL: 'Example:',
    NOTES: [
        'Separate entries with ";"',
        'Reading is optional (for audio)'
    ]
};

// Soft cap on number of unique English terms (map entries) a user can define.
// This protects browser sync storage quota (settings are synced) and keeps
// replacement performance predictable. Typical users rarely exceed a few
// hundred custom terms; 1000 provides generous headroom while remaining
// well below risk thresholds.
export const CUSTOM_VOCAB_MAX_ENTRIES = 1000;