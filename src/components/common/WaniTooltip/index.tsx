import React from 'react';
import { Box, Typography } from '@mui/material';

export interface TooltipProps {
    title: string;
    children: React.ReactNode;
    placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const WaniTooltip: React.FC<TooltipProps> = ({ 
    title, 
    children, 
}) => (
    <Box sx={{ p: 2, maxWidth: 300 }}>
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
            {title}
        </Typography>
        <Box sx={{
            color: 'text.secondary',
            '& a': {
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                    textDecoration: 'underline'
                }
            }
        }}>
            {children}
        </Box>
    </Box>
);