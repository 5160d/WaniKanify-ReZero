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