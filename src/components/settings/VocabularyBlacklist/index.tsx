import React from 'react';
import {
    Box,
    Typography,
    TextField,
    Tooltip,
    IconButton
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { WaniTooltip } from '../../common/WaniTooltip';
import { BLACKLIST_MAX_ENTRIES } from './constants';
import type { ChangingWithErrorHandlingProps } from '~src/components/common/types';
import { useParseBlacklist } from './hooks';

export const VocabularyBlacklistTextArea: React.FC<ChangingWithErrorHandlingProps<string>> = ({
    value,
    onChange,
    onErrorHandled
}) => {
    const { parse, error } = useParseBlacklist();
    const [count, setCount] = React.useState(0);

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const next = event.target.value;
        const set = parse(next);
        setCount(set.size);
        onChange(next);
        onErrorHandled(Boolean(error));
    };

    // initialize on mount
    React.useEffect(() => {
        const set = parse(value);
        setCount(set.size);
        onErrorHandled(Boolean(error));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Box width="100%">
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h6" fontWeight="lg">
                    Blacklisted Vocabulary
                </Typography>
                <Tooltip
                    title={
                        <WaniTooltip title="Blacklisted Vocabulary">
                            <Box sx={{
                                bgcolor: 'background.paper',
                                p: 2,
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider'
                            }}>
                                <Typography variant="body2">
                                    Vocabulary on this list will not be replaced in the pages.
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Vocabulary must be semicolon-separated.
                                </Typography>
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
            </Box>
            <TextField
                id="vocabularyBlacklist"
                placeholder="in;I;why;time"
                multiline
                rows={4}
                value={value}
                onChange={handleChange}
                sx={{
                    width: '100%',
                    '& .MuiInputBase-input': {
                        resize: 'vertical',
                        overflow: 'auto'
                    }
                }}
            />
            <Typography
                variant="body2"
                sx={{ mt: 1, fontFamily: 'monospace' }}
                color={count > BLACKLIST_MAX_ENTRIES ? 'error.main' : 'text.secondary'}
            >
                {count} / {BLACKLIST_MAX_ENTRIES} words
            </Typography>
            {error && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                    {error}
                </Typography>
            )}
        </Box>
    );
};