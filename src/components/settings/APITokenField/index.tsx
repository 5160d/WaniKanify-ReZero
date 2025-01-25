import React from 'react';
import {
    Box,
    TextField,
    Button,
    InputAdornment,
    Tooltip,
    Typography,
    IconButton
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { WaniTooltip } from '../../common/WaniTooltip';
import { WANIKANI_API_URL } from './constants';
import type { ChangingProps } from 'src/components/common/types';


export const APITokenField: React.FC<ChangingProps<string>> = ({ value, onChange }) => {

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
    };

    return (
        <Box display="flex" alignItems="center" gap={2} width="100%">
            <TextField
                required
                id="filled-required"
                label="API Token"
                variant="filled"
                fullWidth
                value={value}
                onChange={handleChange}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end" sx={{ mr: -1 }}>

                            <Tooltip
                                title={
                                    <WaniTooltip title="API Token">
                                        <Typography variant="body2" sx={{ mb: 2 }}>
                                            You can generate a new API token on the{" "}
                                            <a
                                                href={WANIKANI_API_URL}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                API Tokens section
                                            </a>{" "}
                                            of your WaniKani profile.
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 2 }}>
                                            Your API token is only used to read your vocabulary list.
                                        </Typography>
                                    </WaniTooltip>
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