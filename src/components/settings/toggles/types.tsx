export type AudioMode = 'click' | 'hover';

export interface AudioToggleProps {
    enabled: boolean;
    mode: AudioMode;
    onEnabledChange: (enabled: boolean) => void;
    onModeChange: (mode: AudioMode) => void;
}