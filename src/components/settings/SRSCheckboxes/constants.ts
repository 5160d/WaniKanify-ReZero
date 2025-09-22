import type { SRSGroup } from './types';
import { t } from '../../../utils/i18n';

export const SRS_GROUPS: SRSGroup[] = [
    { id: 'apprentice', label: t('srs_level_apprentice'), defaultChecked: true },
    { id: 'guru', label: t('srs_level_guru'), defaultChecked: true },
    { id: 'master', label: t('srs_level_master'), defaultChecked: true },
    { id: 'enlightened', label: t('srs_level_enlightened'), defaultChecked: true },
    { id: 'burned', label: t('srs_level_burned'), defaultChecked: true },
];