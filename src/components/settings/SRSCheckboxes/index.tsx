import React from 'react';
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
import { WaniTooltip } from '../../common/wanitooltip';
import type { ChangingProps } from '~src/components/common/types';

export const SRSCheckboxes: React.FC<ChangingProps<string[]>> = ({ onChange, value }) => {
    const handleChange = (groupId: string, checked: boolean) => {
        const newGroups = checked
            ? [...value, groupId]
            : value.filter(id => id !== groupId);
        onChange(newGroups);
    };

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h6" fontWeight="lg">
                    SRS Groups
                </Typography>
                <Tooltip
                    title={
                        <WaniTooltip title="SRS Filtering">
                            <Typography variant="body2">
                                WaniKanify will only substitute words in the checked SRS groups.
                            </Typography>
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
            </Box>
            <List sx={{
                display: "flex",
                flexDirection: "row",
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                overflow: "hidden",
            }}>
                {SRS_GROUPS.map((group) => (
                    <ListItem key={group.id} sx={{ p: 2 }}>
                        <FormControl>
                            <Checkbox
                                checked={value.includes(group.id)}
                                onChange={(e) => handleChange(group.id, e.target.checked)}
                                color="primary"
                            />
                            <FormLabel>{group.label}</FormLabel>
                        </FormControl>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};