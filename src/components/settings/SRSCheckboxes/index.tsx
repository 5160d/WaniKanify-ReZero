import React from 'react';
import { t } from '~src/utils/i18n';
import {
    Box,
    List,
    ListItem,
    FormControl,
    FormLabel,
    Checkbox,
    Typography,
    Tooltip,
    IconButton
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { SRS_GROUPS } from './constants';
import { WaniTooltip } from '../../common/WaniTooltip';
import type { ChangingProps } from '~src/components/common/types';
import type { SrsGroupsObject } from '../types';

export const SRSCheckboxes: React.FC<ChangingProps<SrsGroupsObject>> = ({ onChange, value }) => {
    const handleChange = (groupId: string, checked: boolean) => {
        const newGroups = {
            ...value,
            [groupId]: checked
        };
        onChange(newGroups);
    };

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h6" fontWeight="lg">
                    {/* SRS groups heading (non-user configurable label) */}
                    SRS Groups
                </Typography>
                <Tooltip
                    title={
                        <WaniTooltip title={t('settings_srs_filtering_title')}> {/* new i18n key */}
                            <Box sx={{
                                bgcolor: 'background.paper',
                                p: 2,
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider'
                            }}>
                                <Typography variant="body2">
                                    {t('settings_srs_filtering_description')}
                                </Typography>
                            </Box>
                        </WaniTooltip>
                    }
                    placement="bottom"
                    arrow
                >
                    <IconButton
                        color="primary"
                        sx={{
                            '&:hover': {
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText'
                            }
                        }}
                    >
                        <HelpOutline />
                    </IconButton>
                </Tooltip>
            </Box >
            <List sx={{
                display: "flex",
                flexDirection: "row",
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                overflow: "auto",
            }}>
                {SRS_GROUPS.map((group) => (
                    <ListItem key={group.id} sx={{ p: 2 }}>
                        <FormControl>
                            <Checkbox
                                checked={value[group.id]}
                                onChange={(e) => handleChange(group.id, e.target.checked)}
                                color="primary"
                            />
                            <FormLabel>{group.label}</FormLabel>
                        </FormControl>
                    </ListItem>
                ))}
            </List>
        </Box >
    );
};