import React from 'react';
import { Button, IconButton, Tooltip, Typography, Box } from '@mui/material';
import { WaniTooltip } from '../../common/wanitooltip';
import { HelpOutline } from "@mui/icons-material";

export const ClearCacheButton: React.FC = () => {
    return (
        <Button
            color="warning"
            type="submit"
            name="clearButton"
            endIcon={
                <Tooltip
                    title={
                        <WaniTooltip title="Vocabulary Cache">
                            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                Delete local vocab and audio cache.
                            </Typography>
                            <Box sx={{
                                bgcolor: 'background.paper',
                                p: 2,
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider'
                            }}>
                                <Typography variant="body2">
                                    Your studied vocabulary words are cached locally to prevent overloading the WaniKani servers.
                                </Typography>
                                <Typography variant="body2">
                                    You may clear the cache manually by hitting this button.
                                    The cache will be repopulated automatically.
                                </Typography>
                            </Box>
                        </WaniTooltip>
                    }
                    placement="bottom"
                    arrow
                >
                    <Box
                        color="inherit"
                        sx={{
                            '&:hover': {
                                bgcolor: 'inherit.light',
                                color: 'inherit.contrastText'
                            },
                            borderRadius: "50%"
                        }}
                    >
                        <HelpOutline color="inherit" />
                    </Box>
                </Tooltip>
            }
        >
            Clear Cache
        </Button>
    );
};