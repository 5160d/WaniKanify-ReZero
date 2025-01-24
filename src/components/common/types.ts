export interface TooltipProps {
  title: string;
  children: React.ReactNode;
}

export interface ChangingProps<T> {
  value: T;
  onChange: (value: T) => void;
}

export interface ChangingWithValidationProps<T> {
  value: T;
  onChange: (value: T, isValid: boolean) => void;
}

export interface ToggleProps extends ChangingProps<boolean> {
  label: string;
  tooltipTitle: string;
  tooltipContent: string | React.ReactNode;
}
