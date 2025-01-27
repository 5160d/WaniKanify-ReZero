import type { SpreadSheet } from './types';

export const EMPTY_SPREADSHEET: SpreadSheet = {
    collectionKey: "",
    spreadSheetName: "",
    englishColumn: "",
    japaneseColumn: "",
    readingColumn: "",
    delimiter: "",
};

export const COLUMNS = [
    { id: 'collectionKey', label: 'Collection Key', placeholder: '1lIo2calXb_GtaQCMLr989_Ma_hxXlxFsHE0egko-D9k' },
    { id: 'spreadSheetName', label: 'Sheet Name', placeholder: '6k Pt 1' },
    { id: 'englishColumn', label: 'English Column', placeholder: 'English' },
    { id: 'japaneseColumn', label: 'Japanese Column', placeholder: 'Japanese' },
    { id: 'readingColumn', label: 'Reading Column', placeholder: 'Reading' },
    { id: 'delimiter', label: 'Delimiter', placeholder: ',' },
];

export const TOOLTIP_CONTENT = {
    TITLE: 'Spreadsheet Import',
    DESCRIPTION: 'Import vocabulary from Google Spreadsheets published on the Web.',
    PUBLISH_INSTRUCTION: 'To publish the spreadsheet: File->Share->Publish to web',
    FIELDS: [
        { 
            id: COLUMNS[0].id,
            label: COLUMNS[0].label,
            description: 'The spreadsheet collection (group of sheets) unique key. Found in its URL and similar to this:',
            example: '1lIo2calXb_GtaQCKLr989-Ma_hxXlxFsHE0egko-D9k'
        },
        {
            id: COLUMNS[1].id,
            label: COLUMNS[1].label,
            description: 'Name of the selected tab at the bottom of the spreadsheet.'
        },
        {
            id: COLUMNS[2].id,
            label: COLUMNS[2].label,
            description: 'Name of the column containing english words.'
        },
        {
            id: COLUMNS[3].id,
            label: COLUMNS[3].label,
            description: 'Name of the column containing Kanji/japanese words.'
        },
        {
            id: COLUMNS[4].id,
            label: COLUMNS[4].label,
            description: 'Name of the column containing furigana readings.',
            optional: true
        },
        {
            id: COLUMNS[5].id,
            label: COLUMNS[5].label,
            description: 'Delimiter for multiple English words (default: comma).',
            optional: true
        }
    ],
    WARNING: 'Browser Sync synchronizes the list of spreadsheets but not the vocabulary. Click import on each different browser.'
};