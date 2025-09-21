import React from 'react';
import { Typography } from '@mui/material';

import { BaseToggle } from '~src/components/common/toggles';
import type { ChangingProps } from '~src/components/common/types';

export const PerformanceTelemetryToggle: React.FC<ChangingProps<boolean>> = ({ value, onChange }) => (
  <BaseToggle
    value={value}
    onChange={onChange}
    label="Performance Telemetry"
    tooltipTitle="Local Debug Telemetry"
    tooltipContent={
      <>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Enable this to surface matcher timing breakdowns in your browser console so you can diagnose slow nodes without rebuilding the extension.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          The data stays on your machine; nothing is transmitted, and disabling the toggle silences the logs.
        </Typography>
      </>
    }
  />
);
