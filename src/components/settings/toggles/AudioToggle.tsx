import React from 'react';
import {
    Stack,
    FormControlLabel,
    Divider,
    RadioGroup,
    Radio,
    Slider,
    Typography
} from '@mui/material';
import { BaseToggle } from '~src/components/common/toggles';
import type { AudioMode, AudioToggleProps } from './types';

export const AudioToggle: React.FC<AudioToggleProps> = ({
    enabled,
    mode,
    volume,
    onEnabledChange,
    onModeChange,
    onVolumeChange
}) => {
    return (
        <Stack display="flex" direction="row" spacing={2} alignItems="center">
            <BaseToggle
                value={enabled}
                onChange={onEnabledChange}
                label="Play Audio"
                tooltipTitle="Optional Audio"
                tooltipContent="Mousing over a word or clicking it will audibly play its pronunciation."
            />
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
            <Stack width={180} px={2} spacing={1} alignItems="flex-start">
                <Typography variant="body2" color="text.secondary">
                    Volume
                </Typography>
                <Slider
                    size="small"
                    value={Math.round(volume * 100)}
                    disabled={!enabled}
                    onChange={(_, value) => {
                        const numericValue = Array.isArray(value) ? value[0] : value
                        onVolumeChange(Math.max(0, Math.min(100, numericValue)) / 100)
                    }}
                    aria-label="Audio volume"
                />
            </Stack>
        </Stack>
    );
};
