import { Button, type ButtonProps } from '@mui/material';
import { saveButtonStyle } from './style';

interface SaveButtonProps extends ButtonProps {
    hasErrors: boolean;
    isDirty: boolean;
}
export const SaveButton = ({ hasErrors, isDirty, ...props }: SaveButtonProps) => (
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
        Save
    </Button>
);