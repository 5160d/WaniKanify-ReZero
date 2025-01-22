import React, { useState } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    Input,
    TableRow,
    IconButton,
    Button,
    Tooltip
} from '@mui/material';
import { Delete, HelpOutline } from '@mui/icons-material';
import { WaniTooltip } from '../../common/WaniTooltip';

interface SitesFilteringTableProps {
    value: string[];
    onChange: (sites: string[]) => void;
}

export const SitesFilteringTable: React.FC<SitesFilteringTableProps> = ({ value, onChange }) => {
    const [newWebsite, setNewWebsite] = useState('');
    const [error, setError] = useState('');

    const validatePattern = (pattern: string): boolean => {
        try {
            new RegExp(pattern);
            return true;
        } catch {
            return false;
        }
    };

    const handleAddWebsite = () => {
        if (!newWebsite.trim()) {
            setError('Pattern cannot be empty');
            return;
        }

        if (!validatePattern(newWebsite)) {
            setError('Invalid regular expression pattern');
            return;
        }

        onChange([...value, newWebsite.trim()]);
        setNewWebsite('');
        setError('');
    };

    const handleDeleteWebsite = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h6" fontWeight="lg">
                    Filtered Websites
                </Typography>
                <Tooltip
                    title={
                        <WaniTooltip title="Filtered Websites">
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Block WaniKanify on these websites.
                            </Typography>
                            <Box sx={{
                                bgcolor: 'background.paper',
                                p: 2,
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider'
                            }}>
                                <Typography variant="body2">
                                    Enter URL patterns using regular expressions.
                                    WaniKanify will not run on matching sites.
                                </Typography>
                            </Box>
                        </WaniTooltip>
                    }
                    arrow
                    placement="bottom"
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

            {/* Table */}
            <Box
                sx={{
                    border: "1px solid",
                    borderColor: "neutral.outlinedBorder",
                    borderRadius: "8px",
                    overflowX: "auto",
                }}
            >
                <TableContainer sx={{ maxHeight: 440 }}>
                    <Table
                        sx={{
                            border: '1px solid rgba(224, 224, 224, 1)', // Adds border to the table
                            '& TableBody TableRow:nth-of-type(odd)': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)', // Striped effect
                            },
                            '& TableBody TableRow:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.08)', // Hover effect
                            },
                        }}
                    >
                        <TableBody>
                            {/* Input Row */}
                            <TableRow hover>
                                <TableCell>
                                    <Input
                                        fullWidth
                                        value={newWebsite}
                                        onChange={(e) => setNewWebsite(e.target.value)}
                                        placeholder="Enter URL pattern (regex)"
                                        error={!!error}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Button
                                        color="primary"
                                        variant="contained"
                                        onClick={handleAddWebsite}
                                        disabled={!newWebsite.trim()}
                                    >
                                        Add
                                    </Button>
                                </TableCell>
                            </TableRow>
                            {/* Dynamically Render Rows */}
                            {value.map((website, index) => (
                                <TableRow hover key={index}>
                                    <TableCell style={{ whiteSpace: 'nowrap' }}>{website}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteWebsite(index)}
                                            aria-label="Delete"
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};