import React, { useState, useCallback } from 'react';
import {
    Box,
    Typography,
    TextField,
    Tooltip,
    IconButton
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { WaniTooltip } from '../../common/WaniTooltip';
import type { VocabularyBlacklistProps, ValidationStatus } from './types';

export const VocabularyBlacklistTextArea: React.FC<VocabularyBlacklistProps> = ({
    value,
    onChange,
    onValidate
}) => {
    const [validationStatus, setValidationStatus] = useState<ValidationStatus>({
        isValid: true,
        message: '',
        type: 'none'
    });

    const validateInput = useCallback((input: string) => {
        const trimmed = input.trim();
        if (!trimmed) {
            return { isValid: true, message: '', type: 'none' as const };
        }

        const hasValidFormat = trimmed.split(';').every(word => word.trim().length > 0);
        if (!hasValidFormat) {
            return {
                isValid: false,
                message: 'Failed to parse the list',
                type: 'error' as const
            };
        }

        return {
            isValid: true,
            message: 'Vocabulary Blacklist applied.',
            type: 'success' as const
        };
    }, []);

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = event.target.value;
        const status = validateInput(newValue);
        
        setValidationStatus(status);
        onChange(newValue);
        onValidate?.(status.isValid);
    };

    return (
        <Box width="100%">
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h6" fontWeight="lg">
                    Blacklisted Vocabulary
                </Typography>
                <Tooltip
                    title={
                        <WaniTooltip title="Blacklisted Vocabulary">
                            <Typography variant="body2">
                                Vocabulary on this list will not be replaced in the pages.
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Vocabulary must be semicolon-separated.
                            </Typography>
                        </WaniTooltip>
                    }
                    placement="bottom"
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
            <TextField
                id="vocabularyBlacklist"
                placeholder="in;I;why;time"
                multiline
                minRows={4}
                value={value}
                onChange={handleChange}
                sx={{ resize: "vertical", overflow: 'auto' }}
                fullWidth
                error={validationStatus.type === 'error'}
            />
            {validationStatus.type !== 'none' && (
                <Typography 
                    variant="body2" 
                    color={validationStatus.type} 
                    sx={{ mt: 1 }}
                >
                    {validationStatus.message}
                </Typography>
            )}
        </Box>
    );
};