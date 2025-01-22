export interface TooltipProps {
    title: string;
    children: React.ReactNode;
}

export interface ToggleProps {
    value: boolean;
    onChange: (value: boolean) => void;
    label: string;
    tooltipTitle: string;
    tooltipContent: string | React.ReactNode;
}

export type AudioMode = 'click' | 'hover';

export interface AudioToggleProps {
    enabled: boolean;
    mode: AudioMode;
    onEnabledChange: (enabled: boolean) => void;
    onModeChange: (mode: AudioMode) => void;
}