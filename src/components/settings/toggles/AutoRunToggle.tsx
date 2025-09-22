import React from 'react';
import { Typography } from '@mui/material';
import { BaseToggle } from '~src/components/common/toggles';
import type { ChangingProps } from '~src/components/common/types';
import { t } from 'src/utils/i18n';

export const AutoRunToggle: React.FC<ChangingProps<boolean>> = ({ value, onChange }) => (
    <BaseToggle
        value={value}
        onChange={onChange}
        label={t('toggle_autorun_label')}
        tooltipTitle={t('toggle_autorun_tooltip_title')}
        tooltipContent={
            <>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    {t('toggle_autorun_tooltip_line1')}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    {t('toggle_autorun_tooltip_line2')}
                </Typography>
            </>
        }
    />
);