import React from 'react';
import { Button, type ButtonProps, Alert, Fade, Box } from '@mui/material';
import { saveButtonStyle } from './style';
import { t } from 'src/utils/i18n';
import { useState, useEffect } from 'react';
import type { SaveStatus, AlertState } from './types';
import type { MessageKey } from '~src/locales/message-keys';

interface SaveButtonProps extends ButtonProps {
    hasErrors: boolean;
    isDirty: boolean;
    status: SaveStatus;
}
export const SaveButton: React.FC<SaveButtonProps> = ({ hasErrors, isDirty, status, ...props }) => {
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Open and auto-dismiss alert for success or error states. Avoid triggering i18n lookup on empty key.
  useEffect(() => {
    if (status.status === 'success' && status.message) {
      setAlert({ open: true, message: status.message, severity: 'success' });
      setTimeout(() => setAlert(prev => ({ ...prev, open: false })), 2000);
    } else if (status.status === 'error' && status.message) {
      setAlert({ open: true, message: status.message, severity: 'error' });
      setTimeout(() => setAlert(prev => ({ ...prev, open: false })), 4000);
    }
  }, [status]);

  return (
    <Box position="relative">
      {alert.open && alert.message && (
        <Fade in timeout={{ enter: 1000, exit: 1200 }}>
          <Alert
            severity={alert.severity}
            sx={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%) translateY(-8px)',
              minWidth: '200px',
              boxShadow: 2
            }}
          >
            {t(alert.message as MessageKey)}
          </Alert>
        </Fade>
      )}
      <Button
        disabled={!isDirty || hasErrors}
        variant={hasErrors ? "outlined" : "contained"}
        sx={{
            ...saveButtonStyle,
            minWidth: 120,
            '&.Mui-disabled': {
                color: theme => hasErrors ? theme.palette.error.main : theme.palette.text.disabled
            }
        }}
        {...props}
      >
  {t('settings_save_button')}
      </Button>
    </Box>
  );
};