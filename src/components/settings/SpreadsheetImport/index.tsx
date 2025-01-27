import React, { useState } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Button,
    IconButton,
    Tooltip,
    Stack
} from '@mui/material';
import { Delete, HelpOutline, WarningAmber } from '@mui/icons-material';
import { orange } from '@mui/material/colors';
import { COLUMNS, EMPTY_SPREADSHEET, TOOLTIP_CONTENT } from './constants';
import type { SpreadSheet, SpreadsheetImportProps } from './types';


export const SpreadsheetImportTable: React.FC<SpreadsheetImportProps> = ({ onChange, value }) => {
    const [newSheet, setNewSheet] = useState<SpreadSheet>(EMPTY_SPREADSHEET);

    const handleAddSpreadsheet = () => {
        onChange([...value, newSheet]);
        setNewSheet(EMPTY_SPREADSHEET);
    };

    const handleDeleteSpreadsheet = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

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
                    PopperProps={{
                        modifiers: [
                            {
                                name: 'preventOverflow',
                                options: {
                                    boundary: window,
                                    altBoundary: true,
                                    padding: 8
                                },
                            },
                            {
                                name: 'flip',
                                options: {
                                    fallbackPlacements: ['top', 'left', 'right'],
                                },
                            }
                        ],
                    }}
                    sx={{
                        '& .MuiTooltip-tooltip': {
                            bgcolor: 'background.paper',
                            boxShadow: 4,
                            border: 1,
                            borderColor: 'divider'
                        }
                    }}
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
                                        <Button size="small" variant="contained" color="primary">
                                            Import
                                        </Button>
                                        <IconButton
                                            onClick={() => handleDeleteSpreadsheet(index)}
                                            color="error"
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Stack>
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
                                    disabled={!Object.values({
                                        collectionKey: newSheet.collectionKey,
                                        spreadSheetName: newSheet.spreadSheetName,
                                        englishColumn: newSheet.englishColumn,
                                        japaneseColumn: newSheet.japaneseColumn
                                    }).every(v => v.trim())}
                                >
                                    Add
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};