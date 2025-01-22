import React from 'react';
import { Typography } from '@mui/material';
import { BaseToggle } from 'src/components/common/toggles/BaseToggle';

export const NumbersReplacementToggle: React.FC<{
    value: boolean;
    onChange: (value: boolean) => void;
}> = ({ value, onChange }) => (
    <BaseToggle
        value={value}
        onChange={onChange}
        label="WaniKanify Numbers"
        tooltipTitle="WaniKanify Numbers"
        tooltipContent={
            <>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    Toggle on for numerical numbers to be replaced with Kanji as well.
                </Typography>
            </>
        }
    />
);