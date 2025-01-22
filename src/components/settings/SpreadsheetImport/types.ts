export interface SpreadSheet {
    collectionKey: string;
    spreadSheetName: string;
    englishColumn: string;
    japaneseColumn: string;
    readingColumn: string;
    delimiter: string;
}

export interface SpreadsheetImportProps {
    onChange: (sheets: SpreadSheet[]) => void;
    value: SpreadSheet[];
}