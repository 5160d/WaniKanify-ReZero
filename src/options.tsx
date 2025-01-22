import { GitHub } from "@mui/icons-material";
import { Box, Stack, Typography, Divider, Button, Card, CardContent, IconButton, Tooltip, useTheme } from "@mui/material";
import { ThemeProvider } from '@mui/material/styles';
import React from "react";

import waniLogo from "data-base64:assets/icon.png";
import * as Comps from "src/components";
import { useSystemTheme } from "src/hooks/systemTheme";
import { waniStyle } from "src/styles/wanikanifyStyles";
import "src/styles/style.css"

export default function Options() {
    const mode = useSystemTheme();
    const theme = useTheme();
        
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
                                            <Comps.APITokenField />
                                        </Box>
                                        <Box mt={3}>
                                            <Comps.ClearCacheButton />
                                        </Box>
                                    </>
                                )}

                                {section === 'Behavior' && (
                                    <>
                                        <Comps.AutoRunToggle />
                                        <Comps.AudioToggle />
                                        <Box mt={3} width="50%">
                                            <Comps.SitesFilteringTable />
                                        </Box>
                                    </>
                                )}

                                {section === 'Vocabulary' && (
                                    <>
                                        <Comps.NumbersReplacementToggle />
                                        <Box mt={3}>
                                            <Comps.SRSCheckboxes />
                                        </Box>
                                        <Box mt={3}>
                                            <Comps.CustomVocabularyTextArea />
                                        </Box>
                                        <Box mt={3}>
                                            <Comps.VocabularyBlacklistTextArea />
                                        </Box>
                                        <Box mt={3}>
                                            <Comps.SpreadsheetImportTable />
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
