import React from 'react'
import { Typography } from '@mui/material'
import { t } from 'src/utils/i18n'

import { BaseToggle } from '~src/components/common/toggles'
import type { ChangingProps } from '~src/components/common/types'

export const TooltipsToggle: React.FC<ChangingProps<boolean>> = ({ value, onChange }) => (
  <BaseToggle
    value={value}
    onChange={onChange}
    label={t('toggle_tooltips_label')}
    tooltipTitle={t('toggle_tooltips_title')}
    tooltipContent={
      <Typography variant="body2" sx={{ mt: 1 }}>
        {t('toggle_tooltips_description')}
      </Typography>
    }
  />
)
