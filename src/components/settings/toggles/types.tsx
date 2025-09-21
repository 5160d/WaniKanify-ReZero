export type AudioMode = 'click' | 'hover';

export interface AudioToggleProps {
    enabled: boolean;
    mode: AudioMode;
    volume: number;
    onEnabledChange: (enabled: boolean) => void;
    onModeChange: (mode: AudioMode) => void;
    onVolumeChange: (volume: number) => void;
}
