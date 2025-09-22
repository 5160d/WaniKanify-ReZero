import type { SpreadSheet } from './types';
import { t } from '~src/utils/i18n';

export const EMPTY_SPREADSHEET: SpreadSheet = {
    collectionKey: "",
    spreadSheetName: "",
    englishColumn: "",
    japaneseColumn: "",
    readingColumn: "",
    delimiter: "",
};

export const COLUMNS = [
    { id: 'collectionKey', label: t('import_column_collection_key_label'), placeholder: t('import_column_collection_key_placeholder') },
    { id: 'spreadSheetName', label: t('import_column_spreadsheet_name_label'), placeholder: t('import_column_spreadsheet_name_placeholder') },
    { id: 'englishColumn', label: t('import_column_english_label'), placeholder: t('import_column_english_placeholder') },
    { id: 'japaneseColumn', label: t('import_column_japanese_label'), placeholder: t('import_column_japanese_placeholder') },
    { id: 'readingColumn', label: t('import_column_reading_label'), placeholder: t('import_column_reading_placeholder') },
    { id: 'delimiter', label: t('import_column_delimiter_label'), placeholder: t('import_column_delimiter_placeholder') },
];

export const TOOLTIP_CONTENT = {
    TITLE: t('import_tooltip_title'),
    DESCRIPTION: t('import_tooltip_description'),
    PUBLISH_INSTRUCTION: t('import_tooltip_publish_instruction'),
    FIELDS: [
        { 
            id: COLUMNS[0].id,
            label: COLUMNS[0].label,
            description: t('import_tooltip_field_collection_key_description'),
            example: t('import_column_collection_key_placeholder'),
        },
        {
            id: COLUMNS[1].id,
            label: COLUMNS[1].label,
            description: t('import_tooltip_field_spreadsheet_name_description')
        },
        {
            id: COLUMNS[2].id,
            label: COLUMNS[2].label,
            description: t('import_tooltip_field_english_description')
        },
        {
            id: COLUMNS[3].id,
            label: COLUMNS[3].label,
            description: t('import_tooltip_field_japanese_description')
        },
        {
            id: COLUMNS[4].id,
            label: COLUMNS[4].label,
            description: t('import_tooltip_field_reading_description'),
            optional: true
        },
        {
            id: COLUMNS[5].id,
            label: COLUMNS[5].label,
            description: t('import_tooltip_field_delimiter_description'),
            optional: true
        }
    ],
    WARNING: t('import_tooltip_warning')
};