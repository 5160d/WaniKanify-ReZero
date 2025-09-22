import React from 'react';
import {
    Box,
    TextField,
    InputAdornment,
    Tooltip,
    Typography,
    IconButton
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { WaniTooltip } from '../../common/WaniTooltip';
import { t } from 'src/utils/i18n';
import { WANIKANI_API_TOKEN_URL } from './constants';
import type { ChangingProps } from 'src/components/common/types';


interface APITokenFieldProps extends ChangingProps<string> {
    error?: boolean;
    helperText?: string;
}

export const APITokenField: React.FC<APITokenFieldProps> = ({ value, onChange, error = false, helperText }) => {

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
    };

    return (
        <Box display="flex" alignItems="center" gap={2} width="100%">
            <TextField
                required
                id="filled-required"
                label={t('popup_api_token_label')}
                variant="filled"
                fullWidth
                value={value}
                onChange={handleChange}
                error={error}
                helperText={helperText}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end" sx={{ mr: -1 }}>

                            <Tooltip
                                title={
                                    <WaniTooltip title={t('popup_api_token_label')}>
                                        <Box sx={{
                                            bgcolor: 'background.paper',
                                            p: 2,
                                            borderRadius: 1,
                                            border: 1,
                                            borderColor: 'divider'
                                        }}>
                                            <Typography variant="body2" sx={{ mb: 2 }}>
                                                {t('popup_api_token_tooltip_line1_part1')}{' '}
                                                <a
                                                    href={WANIKANI_API_TOKEN_URL}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {t('popup_api_token_tooltip_line1_link')}
                                                </a>{' '}
                                                {t('popup_api_token_tooltip_line1_part2')}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 2 }}>
                                                {t('popup_api_token_tooltip_line2')}
                                            </Typography>
                                        </Box>
                                    </WaniTooltip>
                                }
                                placement="bottom"
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

                        </InputAdornment>
                    )
                }}
            />
        </Box>
    );
};
