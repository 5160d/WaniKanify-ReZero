import React from 'react';
import { FormControl, FormControlLabel, Switch, Tooltip, Box, Typography, IconButton } from '@mui/material';
import { WaniTooltip } from '../WaniTooltip';
import type { ToggleProps } from '../types';
import { HelpOutline } from '@mui/icons-material';

export const BaseToggle: React.FC<ToggleProps> = ({
    value,
    onChange,
    label,
    tooltipTitle,
    tooltipContent
}) => (
    <FormControl sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
        <FormControlLabel
            control={<Switch checked={value} onChange={(e) => onChange(e.target.checked)} />}
            label={label}
        />
        <Tooltip
            title={
                <WaniTooltip title={tooltipTitle}>
                    <Box sx={{
                        bgcolor: 'background.paper',
                        p: 2,
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'divider'
                    }}>
                        {typeof tooltipContent === 'string' ? (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                {tooltipContent}
                            </Typography>
                        ) : (
                            tooltipContent
                        )}
                    </Box>
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
    </FormControl>
);