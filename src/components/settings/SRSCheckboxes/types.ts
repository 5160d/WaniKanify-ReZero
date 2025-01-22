export interface SRSGroup {
    id: string;
    label: string;
    defaultChecked: boolean;
}

export interface SRSCheckboxesProps {
    onChange: (groups: string[]) => void;
    value: string[];
}