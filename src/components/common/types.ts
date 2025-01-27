export interface TooltipProps {
  title: string;
  children: React.ReactNode;
}

export interface ChangingProps<T> {
  value: T;
  onChange: (value: T) => void;
}

export interface ChangingWithErrorHandlingProps<T> extends ChangingProps<T> {
  value: T;
  onErrorHandled: (hasError: boolean) => void;
}

export interface ToggleProps extends ChangingProps<boolean> {
  label: string;
  tooltipTitle: string;
  tooltipContent: string | React.ReactNode;
}
