import React from 'react'
import { Typography } from '@mui/material'

import { BaseToggle } from '~src/components/common/toggles'
import type { ChangingProps } from '~src/components/common/types'

export const TooltipsToggle: React.FC<ChangingProps<boolean>> = ({ value, onChange }) => (
  <BaseToggle
    value={value}
    onChange={onChange}
    label="Show Furigana Tooltips"
    tooltipTitle="Furigana Tooltips"
    tooltipContent={
      <Typography variant="body2" sx={{ mt: 1 }}>
        Toggle off to hide the original English and furigana tooltips that appear when hovering
        over replaced words.
      </Typography>
    }
  />
)
