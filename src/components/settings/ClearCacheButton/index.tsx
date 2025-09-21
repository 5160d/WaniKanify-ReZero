import React, { useState } from 'react';
import { Button, Tooltip, Typography, Box } from '@mui/material';
import { WaniTooltip } from '../../common/WaniTooltip';
import { HelpOutline } from "@mui/icons-material";

export const ClearCacheButton: React.FC = () => {
    const [clearing, setClearing] = useState(false)
    const [done, setDone] = useState(false)

    const handleClick = async () => {
        setClearing(true)
        setDone(false)
        try {
            await new Promise<void>((resolve) => {
                chrome.runtime.sendMessage({ type: 'wanikanify:clear-cache' }, () => resolve())
            })
            setDone(true)
            setTimeout(() => setDone(false), 2000)
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('WaniKanify: failed to clear cache', error)
        } finally {
            setClearing(false)
        }
    }

    return (
        <Button
            color="warning"
            type="button"
            name="clearButton"
            disabled={clearing}
            onClick={handleClick}
            endIcon={
                <Tooltip
                    title={
                        <WaniTooltip title="Vocabulary Cache">
                            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                Delete the local vocabulary cache.
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
                        <HelpOutline color="inherit" sx={{ mt: -0.5 }}/>
                    </Box>
                </Tooltip>
            }
        >
            {clearing ? 'Clearing…' : done ? 'Cleared!' : 'Clear Cache'}
        </Button>
    );
};