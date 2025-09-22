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
import { t } from '~src/utils/i18n';
import type { ChangingProps } from '~src/components/common/types';


export const SitesFilteringTable: React.FC<ChangingProps<string[]>> = ({ value, onChange }) => {
    const [newRegex, setNewRegex] = useState('');

    const handleAddRegex = () => {
        onChange([...value, newRegex.trim()]);
        setNewRegex('');
    };

    const handleDeleteRegex = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h6" fontWeight="lg">
                    {t('sites_filtering_heading_internal')}
                </Typography>
                <Tooltip
                    title={
                        <WaniTooltip title={t('sites_filtering_tooltip_title')}>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                {t('sites_filtering_tooltip_line1')}
                            </Typography>
                            <Box sx={{
                                bgcolor: 'background.paper',
                                p: 2,
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider'
                            }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>{t('sites_filtering_tooltip_pattern_types')}</strong>
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    • <code>{t('sites_filtering_tooltip_pattern_domain').split(' - ')[0]}</code> {t('sites_filtering_tooltip_pattern_domain').split(' - ').slice(1).join(' - ')}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    • <code>|http://exact-url.com/|</code> {t('sites_filtering_tooltip_pattern_exact').replace('|http://exact-url.com/| - ', '')}
                                </Typography>
                                <Typography variant="body2">
                                    • <code>/path/*/file^</code> {t('sites_filtering_tooltip_pattern_wildcard').replace('/path/*/file^ - ', '')}
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
                                        value={newRegex}
                                        onChange={(e) => setNewRegex(e.target.value)}
                                        placeholder={t('sites_filtering_placeholder_pattern')}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Button
                                        color="primary"
                                        variant="contained"
                                        onClick={handleAddRegex}
                                        disabled={!newRegex.trim()}
                                    >
                                        {t('sites_filtering_button_add')}
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
                                            onClick={() => handleDeleteRegex(index)}
                                            aria-label={t('sites_filtering_delete_aria')}
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