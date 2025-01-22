import React from 'react';
import {
    Box,
    TextField,
    Button,
    InputAdornment,
    IconButton,
    Tooltip,
    Typography
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { WaniTooltip } from '../../common/WaniTooltip';
import { WANIKANI_API_URL } from './constants';

export const APITokenField: React.FC = () => {
    return (
        <Box display="flex" alignItems="center" gap={2} width="100%">
            <TextField
                required
                id="filled-required"
                label="API Token"
                variant="filled"
                fullWidth
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end" sx={{ mr: -1 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                endIcon={
                                    <Tooltip
                                        title={
                                            <WaniTooltip title="API Key">
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
                                        <IconButton color="inherit">
                                            <HelpOutline />
                                        </IconButton>
                                    </Tooltip>
                                }
                            >
                                Test API Token
                            </Button>
                        </InputAdornment>
                    )
                }}
            />
        </Box>
    );
};