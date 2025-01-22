import React from 'react';
import { Typography } from '@mui/material';
import { BaseToggle } from 'src/components/common/toggles/BaseToggle';

export const AutoRunToggle: React.FC<{
    value: boolean;
    onChange: (value: boolean) => void;
}> = ({ value, onChange }) => (
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