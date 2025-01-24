import React from 'react';
import { Typography } from '@mui/material';
import { BaseToggle } from '~src/components/common/toggles';
import type { ChangingProps } from '~src/components/common/types';

export const NumbersReplacementToggle: React.FC<ChangingProps<boolean>> = ({ value, onChange }) => (
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