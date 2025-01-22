import React from 'react';
import { Box, Typography, TextField, Tooltip, IconButton } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { WaniTooltip } from '../../common/WaniTooltip';
import type { CustomVocabularyProps } from './types';
import { EXAMPLES, HELP_TEXT } from './constants';
import { useVocabularyValidation } from './hooks';

export const CustomVocabularyTextArea: React.FC<CustomVocabularyProps> = ({
    value,
    onChange,
    error: externalError
}) => {
    const { error: validationError, validateEntry } = useVocabularyValidation();

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        validateEntry(newValue);
        onChange(newValue);
    };

    return (
        <Box width="100%">
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h6" fontWeight="lg">
                    {HELP_TEXT.TITLE}
                </Typography>
                <Tooltip
                    title={
                        <WaniTooltip title={HELP_TEXT.TITLE}>
                            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                {HELP_TEXT.DESCRIPTION}
                            </Typography>
                            <Box sx={{
                                bgcolor: 'background.paper',
                                p: 2,
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider'
                            }}>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                    {HELP_TEXT.FORMAT_LABEL}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    {EXAMPLES.FORMAT}
                                </Typography>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                    {HELP_TEXT.EXAMPLE_LABEL}
                                </Typography>
                                <Typography variant="body2" sx={{
                                    fontFamily: 'monospace',
                                    bgcolor: 'action.hover',
                                    p: 1,
                                    borderRadius: 0.5
                                }}>
                                    {EXAMPLES.ENTRY}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 2 }}>
                                    {HELP_TEXT.NOTES.map((note, i) => (
                                        <React.Fragment key={i}>
                                            • {note}<br />
                                        </React.Fragment>
                                    ))}
                                </Typography>
                            </Box>
                        </WaniTooltip>
                    }
                    placement="bottom-start"
                    arrow
                >
                    <IconButton color="primary">
                        <HelpOutline />
                    </IconButton>
                </Tooltip>
            </Box>
            <TextField
                id="customVocabulary"
                placeholder={EXAMPLES.MULTIPLE}
                multiline
                minRows={4}
                value={value}
                onChange={handleChange}
                error={Boolean(externalError || validationError)}
                helperText={externalError || validationError}
                sx={{ 
                    width: '100%',
                    '& .MuiInputBase-input': {
                        resize: 'vertical',
                        overflow: 'auto'
                    }
                }}
            />
        </Box>
    );
};