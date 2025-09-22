// These constants previously held English literals; now keys/placeholder examples shift to i18n.
export const EXAMPLES = {
    FORMAT: 'eng1,eng2,...:vocab:reading', // example snippet kept (may be embedded in localized tooltip)
    ENTRY: 'cat,feline:猫:ねこ',
    MULTIPLE: 'cat,feline:猫:ねこ;cold:寒い:さむい'
};

export const HELP_TEXT = {
    TITLE_KEY: 'settings_custom_vocab_heading',
    DESCRIPTION_KEY: 'custom_vocab_description',
    FORMAT_LABEL_KEY: 'custom_vocab_format_label',
    EXAMPLE_LABEL_KEY: 'custom_vocab_example_label',
    NOTES_KEYS: [
        'custom_vocab_notes_separator',
        'custom_vocab_notes_reading_optional'
    ]
};

// Soft cap on number of unique English terms (map entries) a user can define.
// This protects browser sync storage quota (settings are synced) and keeps
// replacement performance predictable. Typical users rarely exceed a few
// hundred custom terms; 1000 provides generous headroom while remaining
// well below risk thresholds.
export const CUSTOM_VOCAB_MAX_ENTRIES = 1000;