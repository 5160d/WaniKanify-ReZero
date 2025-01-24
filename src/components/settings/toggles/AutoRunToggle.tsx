import React from 'react';
import { Typography } from '@mui/material';
import { BaseToggle } from '~src/components/common/toggles';
import type { ChangingProps } from '~src/components/common/types';

export const AutoRunToggle: React.FC<ChangingProps<boolean>> = ({ value, onChange }) => (
    <BaseToggle
        value={value}
        onChange={onChange}
        label="Auto Run"
        tooltipTitle="Auto Run"
        tooltipContent={
            <>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    You may have WaniKanify run automatically after a page loads. Otherwise, click on the extension icon to run it.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    With both settings, clicking the extension will return the page to its original state.
                </Typography>
            </>
        }
    />
);