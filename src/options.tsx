// External Libraries
import React, { useState } from "react";
import { GitHub } from "@mui/icons-material";
import { 
    Box, 
    Stack, 
    Typography, 
    Divider, 
    Button, 
    Card, 
    CardContent, 
    IconButton, 
    Tooltip, 
    useTheme 
} from "@mui/material";
import { ThemeProvider } from '@mui/material/styles';
import { useWaniSettings } from 'src/components/settings/hooks/useWaniSettings';

// Components
import { APITokenField } from "src/components/settings/APITokenField";
import { SRSCheckboxes } from "src/components/settings/SRSCheckboxes";
import { SpreadsheetImportTable } from "src/components/settings/SpreadsheetImport";
import { CustomVocabularyTextArea } from "src/components/settings/CustomVocabulary";
import { VocabularyBlacklistTextArea } from "src/components/settings/VocabularyBlacklist/VocabularyBlacklist";
import { SitesFilteringTable } from "src/components/settings/SitesFiltering";
import { ClearCacheButton } from "src/components/settings/ClearCacheButton";
import { AutoRunToggle } from "src/components/settings/toggles/AutoRunToggle";
import { NumbersReplacementToggle } from "src//components/settings/toggles/NumbersToggle";
import { AudioToggle } from "src/components/settings/toggles/AudioToggle";

// Hooks and Utils
import { useSystemTheme } from "src/hooks/systemTheme";
import { DEFAULT_SETTINGS } from "src/components/settings/constants";

// Assets and Styles
import waniLogo from "data-base64:assets/icon.png";
import { waniStyle } from "src/styles/wanikanifyStyles";
import "src/styles/style.css";

export default function Options() {
    const mode = useSystemTheme();
    const theme = useTheme();
    const { settings, updateSettings } = useWaniSettings();
    
    const handleSave = () => {
        updateSettings(settings);
    };
        
    return (
        <ThemeProvider theme={waniStyle(mode)}>
            <Box sx={{ 
                bgcolor: 'background.default',
                minHeight: '100vh',
                transition: 'background-color 0.3s ease'
            }}>
                {/* Header */}
                <Stack 
                    direction="row" 
                    spacing={2} 
                    alignItems="center" 
                    sx={{
                        p: 3,
                        bgcolor: 'background.paper',
                        borderBottom: 1,
                        borderColor: 'divider',
                        boxShadow: 1
                    }}
                >
                    <img
                        src={waniLogo}
                        alt="Logo"
                        style={{ width: 96, height: 96 }}
                    />
                    <Typography 
                        variant="h4" 
                        fontWeight="bold"
                        sx={{ color: 'primary.main' }}
                    >
                        WaniKanify ReZero - Settings
                    </Typography>
                </Stack>

                {/* Content */}
                <Box p={4} sx={{ maxWidth: 1200, mx: 'auto' }}>
                    {/* Sections */}
                    {['General', 'Behavior', 'Vocabulary'].map((section, index) => (
                        <Card key={section} sx={{ mb: 4 }}>
                            <CardContent>
                                <Typography 
                                    variant="h6" 
                                    fontWeight="600" 
                                    gutterBottom
                                    sx={{ 
                                        color: 'primary.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}
                                >
                                    {`${index + 1}. ${section}`}
                                </Typography>
                                <Divider sx={{ mb: 3 }} />
                                
                                {section === 'General' && (
                                    <>
                                        <Box display="flex" alignItems="center" width="70%">
                                            <APITokenField />
                                        </Box>
                                        <Box mt={3}>
                                            <ClearCacheButton />
                                        </Box>
                                    </>
                                )}

                                {section === 'Behavior' && (
                                    <>
                                        <AutoRunToggle
                                            value={settings.autoRun}
                                            onChange={(newValue) => updateSettings({ autoRun: newValue })}
                                        />
                                        <AudioToggle
                                            enabled={settings.audio.enabled}
                                            mode={settings.audio.mode}
                                            onEnabledChange={(enabled) => updateSettings({ audio: { ...settings.audio, enabled } })}
                                            onModeChange={(mode) => updateSettings({ audio: { ...settings.audio, mode } })}
                                        />
                                        <Box mt={3} width="50%">
                                            <SitesFilteringTable 
                                                value={settings.sitesFiltering}
                                                onChange={(newValue) => updateSettings({ sitesFiltering: newValue })}
                                            />
                                        </Box>
                                    </>
                                )}

                                {section === 'Vocabulary' && (
                                    <>
                                        <NumbersReplacementToggle
                                            value={settings.numbersReplacement}
                                            onChange={(newValue) => updateSettings({ numbersReplacement: newValue })}
                                        />
                                        <Box mt={3}>
                                            <SRSCheckboxes 
                                                value={settings.srsGroups} 
                                                onChange={(newValue) => {
                                                    updateSettings({ srsGroups: newValue });
                                                }} 
                                            />
                                        </Box>
                                        <Box mt={3}>
                                            <CustomVocabularyTextArea 
                                                value={settings.customVocabulary}
                                                onChange={(newValue) => updateSettings({ customVocabulary: newValue })}
                                            />
                                        </Box>
                                        <Box mt={3}>
                                            <VocabularyBlacklistTextArea 
                                                value={settings.vocabularyBlacklist.join('\n')}
                                                onChange={(newValue) => updateSettings({ vocabularyBlacklist: newValue.split('\n') })}
                                            />
                                        </Box>
                                        <Box mt={3}>
                                            <SpreadsheetImportTable 
                                                value={settings.spreadsheetImport}
                                                onChange={(newValue) => updateSettings({ spreadsheetImport: newValue })}
                                            />
                                        </Box>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {/* Save Button */}
                    <Box 
                        sx={{ 
                            position: 'sticky',
                            bottom: 24,
                            display: 'flex',
                            justifyContent: 'center'
                        }}
                    >
                        <Button 
                            variant="contained"
                            color="primary" 
                            size="large"
                            onClick={handleSave}
                            sx={{
                                px: 6,
                                py: 1.5,
                                boxShadow: theme.shadows[4]
                            }}
                        >
                            Save Changes
                        </Button>
                    </Box>
                </Box>
                {/* Footer */}
                <Box 
                    sx={{ 
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 1,
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        <Tooltip title="View on GitHub">
                            <IconButton
                                onClick={() => window.open('https://github.com/5160d/WaniKanify-ReZero', '_blank', 'noopener')}
                                aria-label="View source on GitHub"
                                sx={{
                                    '&:hover': {
                                        color: 'primary.main'
                                    }
                                }}
                            >
                                <GitHub fontSize="large" />
                            </IconButton>
                        </Tooltip>
                    </Box>
            </Box>
        </ThemeProvider>
    );
}
