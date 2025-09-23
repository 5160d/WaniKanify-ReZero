import React, { useEffect, useState } from 'react';
import { Button, Tooltip, Typography, Box } from '@mui/material';
import { WaniTooltip } from '../../common/WaniTooltip';
import { t } from '../../../utils/i18n';
import { HelpOutline } from "@mui/icons-material";
import { log } from '~src/utils/log'
import { __WK_EVT_CLEAR_CACHE, __WK_EVT_STATE } from '~src/internal/tokens'

interface ExtensionStateEvent {
    type: typeof __WK_EVT_STATE
    payload: { isRefreshing: boolean }
}

export const ClearCacheButton: React.FC = () => {
    const [clearing, setClearing] = useState(false)
    const [done, setDone] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)

    useEffect(() => {
        const handler = (message: unknown) => {
            const evt = message as Partial<ExtensionStateEvent>
            if (evt?.type === __WK_EVT_STATE && typeof evt.payload?.isRefreshing === 'boolean') {
                setIsRefreshing(evt.payload.isRefreshing)
            }
        }
        // Chrome typings may not perfectly match; cast to expected signature
        chrome.runtime.onMessage.addListener(handler as (msg: unknown) => void)
        return () => {
            chrome.runtime.onMessage.removeListener(handler as (msg: unknown) => void)
        }
    }, [])

    const handleClick = async () => {
        setClearing(true)
        setDone(false)
        try {
            await new Promise<void>((resolve) => {
                chrome.runtime.sendMessage({ type: __WK_EVT_CLEAR_CACHE }, () => resolve())
            })
            setDone(true)
            setTimeout(() => setDone(false), 2000)
        } catch (error) {
            log.error('failed to clear cache', error)
        } finally {
            setClearing(false)
        }
    }

    return (
        <Button
            color="warning"
            type="button"
            name="clearButton"
            disabled={clearing || isRefreshing}
            onClick={handleClick}
            endIcon={
                <Tooltip
                    title={
                        <WaniTooltip title={t('settings_clear_cache_title')}>
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
                        {clearing
                            ? t('settings_clear_cache_progress_clearing')
                            : isRefreshing
                                ? t('settings_clear_cache_progress_rebuilding')
                                : done
                                    ? t('settings_clear_cache_progress_cleared')
                                    : t('settings_clear_cache_button')}
        </Button>
    );
};