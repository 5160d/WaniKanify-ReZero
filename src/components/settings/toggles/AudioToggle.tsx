import React from 'react';
import {
    Stack,
    FormControlLabel,
    Divider,
    RadioGroup,
    Radio
} from '@mui/material';
import type { AudioToggleProps, AudioMode } from '../../common/types';
import { BaseToggle } from 'src/components/common/toggles/BaseToggle';

export const AudioToggle: React.FC<AudioToggleProps> = ({
    enabled,
    mode,
    onEnabledChange,
    onModeChange
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
        </Stack>
    );
};