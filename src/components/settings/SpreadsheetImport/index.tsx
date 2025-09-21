import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    IconButton,
    LinearProgress,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Paper,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import { Delete, HelpOutline, ExpandLess, ExpandMore, Restore, WarningAmber } from '@mui/icons-material';
import { orange } from '@mui/material/colors';

import { COLUMNS, EMPTY_SPREADSHEET, TOOLTIP_CONTENT } from './constants';
import type { SpreadSheet, SpreadsheetImportProps } from './types';
import {
    deleteHistoryEntry,
    getImportHistory,
    importSpreadsheet,
    restoreHistoryEntry,
    type SpreadsheetImportHistoryEntry
} from '~src/services/spreadsheetImport';

const REQUIRED_COLUMNS: Array<keyof SpreadSheet> = [
    'collectionKey',
    'spreadSheetName',
    'englishColumn',
    'japaneseColumn'
];

const buildSheetKey = (sheet: SpreadSheet) => `${sheet.collectionKey}::${sheet.spreadSheetName}`;

const normalizeSheet = (sheet: SpreadSheet): SpreadSheet => ({
    collectionKey: sheet.collectionKey.trim(),
    spreadSheetName: sheet.spreadSheetName.trim(),
    englishColumn: sheet.englishColumn.trim(),
    japaneseColumn: sheet.japaneseColumn.trim(),
    readingColumn: sheet.readingColumn?.trim() ?? '',
    delimiter: sheet.delimiter?.trim() ?? ''
});

interface ImportState {
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
    entries?: number;
    errors?: number;
}

export const SpreadsheetImportTable: React.FC<SpreadsheetImportProps> = ({ onChange, value }) => {
    const [newSheet, setNewSheet] = useState<SpreadSheet>(EMPTY_SPREADSHEET);
    const [states, setStates] = useState<Record<string, ImportState>>({});
    const [history, setHistory] = useState<SpreadsheetImportHistoryEntry[]>([]);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' } | null>(null);

    const canAddNewSheet = useMemo(() =>
        REQUIRED_COLUMNS.every((field) => newSheet[field]?.trim()),
        [newSheet]
    );

    const loadHistory = async () => {
        try {
            const records = await getImportHistory();
            setHistory(records);
        } catch (error) {
            console.error('WaniKanify: failed to load import history', error);
        }
    };

    useEffect(() => {
        void loadHistory();
    }, []);

    const setImportState = (key: string, next: Partial<ImportState>) => {
        setStates((prev) => ({ ...prev, [key]: { ...prev[key], ...next } }));
    };

    const handleAddSpreadsheet = () => {
        const trimmed = normalizeSheet(newSheet);
        const key = buildSheetKey(trimmed);
        const existingIndex = value.findIndex((sheet) => buildSheetKey(normalizeSheet(sheet)) === key);
        const nextSheets = existingIndex >= 0
            ? value.map((sheet, idx) => (idx === existingIndex ? trimmed : sheet))
            : [...value, trimmed];

        onChange(nextSheets);
        setStates((prev) => ({
            ...prev,
            [key]: {
                status: 'idle',
                message: 'Not imported yet'
            }
        }));
        setNewSheet(EMPTY_SPREADSHEET);
    };

    const handleDeleteSpreadsheet = (index: number) => {
        const sheet = value[index];
        onChange(value.filter((_, i) => i !== index));
        if (sheet) {
            const sheetKey = buildSheetKey(normalizeSheet(sheet));
            setStates((prev) => {
                const next = { ...prev };
                delete next[sheetKey];
                return next;
            });
        }
    };

    const handleImport = async (sheet: SpreadSheet, index: number) => {
        const sanitized = normalizeSheet(sheet);

        const key = buildSheetKey(sanitized);
        if (!REQUIRED_COLUMNS.every((field) => sanitized[field]?.trim())) {
            setImportState(key, {
                status: 'error',
                message: 'Fill all required fields before importing.'
            });
            return;
        }

        onChange(value.map((item, i) => (i === index ? sanitized : item)));

        try {
            setImportState(key, { status: 'loading', message: 'Importing...' });
            const { historyEntry } = await importSpreadsheet(sanitized);
            setImportState(key, {
                status: 'success',
                message: `Imported ${historyEntry.entryCount} entries${historyEntry.errors.length ? ` with ${historyEntry.errors.length} warnings` : ''}`,
                entries: historyEntry.entryCount,
                errors: historyEntry.errors.length
            });
            setSnackbar({ open: true, message: 'Spreadsheet imported successfully', severity: 'success' });
            await loadHistory();
            if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
                chrome.runtime.sendMessage({ type: 'wanikanify:refresh-imported-vocabulary' }).catch(() => {});
            }
        } catch (error) {
            console.error('WaniKanify: spreadsheet import failed', error);
            setImportState(key, {
                status: 'error',
                message: error instanceof Error ? error.message : 'Import failed'
            });
            setSnackbar({ open: true, message: 'Failed to import spreadsheet', severity: 'error' });
        }
    };

    const handleRestore = async (record: SpreadsheetImportHistoryEntry) => {
        try {
            await restoreHistoryEntry(record.id);
            setSnackbar({ open: true, message: `Restored ${record.sheet.spreadSheetName}`, severity: 'success' });
            await loadHistory();
            if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
                chrome.runtime.sendMessage({ type: 'wanikanify:refresh-imported-vocabulary' }).catch(() => {});
            }
        } catch (error) {
            console.error('WaniKanify: restore history failed', error);
            setSnackbar({ open: true, message: 'Failed to restore backup', severity: 'error' });
        }
    };

    const handleDeleteHistoryEntry = async (record: SpreadsheetImportHistoryEntry) => {
        try {
            const removed = await deleteHistoryEntry(record.id);
            if (removed) {
                const removedKey = buildSheetKey(normalizeSheet(removed.sheet));
                setStates((prev) => {
                    const next = { ...prev };
                    delete next[removedKey];
                    return next;
                });
                setSnackbar({ open: true, message: `Removed imported data for ${removed.sheet.spreadSheetName}`, severity: 'success' });
            } else {
                setSnackbar({ open: true, message: 'History entry not found', severity: 'error' });
            }
            await loadHistory();
            if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
                chrome.runtime.sendMessage({ type: 'wanikanify:refresh-imported-vocabulary' }).catch(() => {});
            }
        } catch (error) {
            console.error('WaniKanify: delete history entry failed', error);
            setSnackbar({ open: true, message: 'Failed to delete history entry', severity: 'error' });
        }
    };

    const renderImportState = (sheet: SpreadSheet) => {
        const sheetKey = buildSheetKey(normalizeSheet(sheet));
        const state = states[sheetKey];
        if (!state) {
            return null;
        }

        if (state.status === 'loading') {
            return (
                <Stack spacing={1} sx={{ mt: 1 }}>
                    <LinearProgress />
                    <Typography variant="caption" color="text.secondary">{state.message}</Typography>
                </Stack>
            );
        }

        const color = state.status === 'success'
            ? 'success.main'
            : state.status === 'error'
            ? 'error.main'
            : 'text.secondary';
        return (
            <Typography
                variant="caption"
                color={color}
                sx={{ display: 'block', mt: 1 }}
            >
                {state.message}
            </Typography>
        );
    };

    const handleSnackbarClose = () => setSnackbar(null);

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h6" fontWeight="lg">
                    Imported Vocabulary
                </Typography>
                <Tooltip
                    title={
                        <Box sx={{
                            p: 2,
                            width: 800,
                            maxWidth: '90vw',
                            bgcolor: 'background.tooltip',
                            borderRadius: 1,
                        }}>
                            <Typography
                                variant="h6"
                                fontWeight="bold"
                                sx={{
                                    color: 'primary.main',
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    pb: 1,
                                    mb: 2
                                }}
                            >
                                {TOOLTIP_CONTENT.TITLE}
                            </Typography>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 2fr',
                                gap: 3
                            }}>
                                <Box>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        {TOOLTIP_CONTENT.DESCRIPTION}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                                        {TOOLTIP_CONTENT.PUBLISH_INSTRUCTION}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    bgcolor: 'background.paper',
                                    p: 2,
                                    borderRadius: 1,
                                    border: 1,
                                    borderColor: 'divider'
                                }}>
                                    <Typography variant="body2" component="div" sx={{ mt: 2, color: 'text.secondary' }}>
                                        {TOOLTIP_CONTENT.FIELDS.map((field, index) => (
                                            <React.Fragment key={field.id}>
                                                <strong>
                                                    {`${index + 1}.`}{field.optional && <Box component="span" color="success.main" display="inline"> Optional </Box>}{` ${field.label}: `}
                                                </strong>
                                                {field.description}
                                                {field.example && (
                                                    <>
                                                        <br />
                                                        <code style={{ backgroundColor: 'action.hover', padding: '2px 4px' }}>
                                                            {field.example}
                                                        </code>
                                                    </>
                                                )}
                                                <br />
                                            </React.Fragment>
                                        ))}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                                        <WarningAmber sx={{ color: orange[500] }} /> {TOOLTIP_CONTENT.WARNING}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    }
                    placement="top"
                    arrow
                >
                    <IconButton
                        color="primary"
                        sx={{
                            '&:hover': {
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText'
                            }
                        }}
                    >
                        <HelpOutline />
                    </IconButton>
                </Tooltip>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {COLUMNS.map(column => (
                                <TableCell key={column.id}>{column.label}</TableCell>
                            ))}
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {value.map((sheet, index) => (
                            <TableRow key={index}>
                                {COLUMNS.map(column => (
                                    <TableCell key={column.id}>
                                        {sheet[column.id as keyof SpreadSheet]}
                                    </TableCell>
                                ))}
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1}>
                                        <Button size="small" variant="contained" color="primary" onClick={() => handleImport(sheet, index)}>
                                            Import
                                        </Button>
                                        <IconButton
                                            onClick={() => handleDeleteSpreadsheet(index)}
                                            color="error"
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Stack>
                                    {renderImportState(sheet)}
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            {COLUMNS.map(column => (
                                <TableCell key={column.id}>
                                    <TextField
                                        size="small"
                                        placeholder={column.placeholder}
                                        value={newSheet[column.id as keyof SpreadSheet]}
                                        onChange={(e) => setNewSheet(prev => ({
                                            ...prev,
                                            [column.id]: e.target.value
                                        }))}
                                        fullWidth
                                    />
                                </TableCell>
                            ))}
                            <TableCell align="right">
                                <Button
                                    variant="contained"
                                    onClick={handleAddSpreadsheet}
                                    disabled={!canAddNewSheet}
                                >
                                    Add
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            <Box mt={4}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <Typography variant="h6" fontWeight="lg">
                        Import History
                    </Typography>
                    <Chip label={history.length} />
                    <Tooltip
                        title={historyOpen ? 'Hide history' : 'Show history'}
                        componentsProps={{
                            tooltip: {
                                sx: (theme) =>
                                    theme.palette.mode === 'light'
                                        ? { color: theme.palette.text.primary }
                                        : undefined
                            }
                        }}
                    >
                        <IconButton onClick={() => setHistoryOpen(prev => !prev)}>
                            {historyOpen ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </Tooltip>
                </Stack>
                {historyOpen && (
                    history.length ? (
                        <List dense>
                            {history.map((record) => (
                                <ListItem key={record.id} divider>
                                    <ListItemText
                                        primary={`${record.sheet.spreadSheetName} (${record.sheet.collectionKey})`}
                                        secondary={`Imported ${record.entryCount} entries • ${new Date(record.createdAt).toLocaleString()}${record.errors.length ? ` • ${record.errors.length} warnings` : ''}`}
                                    />
                                    <ListItemSecondaryAction>
                                        <Tooltip title="Restore">
                                            <IconButton edge="end" onClick={() => handleRestore(record)} sx={{ mr: 1 }}>
                                                <Restore />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton edge="end" onClick={() => handleDeleteHistoryEntry(record)}>
                                                <Delete />
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No import history available yet.
                        </Typography>
                    )
                )}
            </Box>

            <Snackbar
                open={Boolean(snackbar)}
                autoHideDuration={3000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {snackbar ? (
                    <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                ) : null}
            </Snackbar>
        </Box>
    );
};
