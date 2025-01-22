import React from 'react';
import {
    Stack,
    FormControl,
    FormControlLabel,
    Switch,
    Tooltip,
    IconButton,
    Typography,
    Divider,
    RadioGroup,
    Radio
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { WaniTooltip } from '../../common/WaniTooltip';
import type { AudioToggleProps, AudioMode } from '../../common/types';

export const AudioToggle: React.FC<AudioToggleProps> = ({
    enabled,
    mode,
    onEnabledChange,
    onModeChange
}) => {
    return (
        <Stack display="flex" direction="row" spacing={2} alignItems="center">
            <FormControl sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={enabled}
                            onChange={(e) => onEnabledChange(e.target.checked)}
                        />
                    }
                    label="Play Audio"
                />
                <Tooltip
                    title={
                        <WaniTooltip title="Optional Audio">
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Mousing over a word or clicking it will audibly play its pronunciation.
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
            </FormControl>
            <Divider orientation="vertical" sx={{ height: "32px" }} />
            <RadioGroup
                row
                name="audioMode"
                value={mode}
                onChange={(e) => onModeChange(e.target.value as AudioMode)}
                sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1 }}
            >
                <FormControlLabel
                    value="click"
                    control={<Radio disabled={!enabled} id="audioClick" />}
                    label="Click"
                />
                <FormControlLabel
                    value="hover"
                    control={<Radio disabled={!enabled} id="audioHover" />}
                    label="Hover"
                />
            </RadioGroup>
        </Stack>
    );
};