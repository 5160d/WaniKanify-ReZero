import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Box, CssBaseline, Typography, Divider, Tooltip, useMediaQuery, IconButton, Button } from "@mui/material";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import React from "react";

import waniLogo from "data-base64:assets/icon.png";
import * as Comps from "src/components";
import "src/styles/style.css"

function OptionsIndex() {

    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

    const WanikanifyTheme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode: prefersDarkMode ? 'dark' : 'light',
                },
            }),
        [prefersDarkMode],
    );

    return (
        <ThemeProvider theme={WanikanifyTheme}>
            <CssBaseline />
            {/* Header */}
            <Box
                display="flex"
                alignItems="center"
                bgcolor="neutral.softBg"
                p={2}
                sx={{ borderBottom: "1px solid", borderColor: "neutral.outlinedBorder" }}
            >
                {/* Logo */}
                <img
                    src={waniLogo}
                    alt="Logo"
                    style={{ width: 96, height: 96, marginRight: "1rem" }}
                />
                {/* Title */}
                <Typography variant="h4" fontWeight="bold">
                    WaniKanify ReZero - Settings
                </Typography>
            </Box>

            {/* Content */}
            <Box p={4}>
                {/* General Settings */}
                <Typography variant="h6" fontWeight="600" gutterBottom>
                    1. General
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" alignItems="center" gap={2} width="50%">
                    <Comps.APITokenField />
                    {/* Tooltip */}
                    <Tooltip
                        title={
                            <Box>
                                <Typography variant="h5" fontWeight="bold">
                                    API Key
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    You can generate a new API token on the
                                    <a
                                        href="https://www.wanikani.com/settings/personal_access_tokens"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: "blue", textDecoration: "underline" }}
                                    >
                                        {" "}
                                        API Tokens section{" "}
                                    </a>
                                    of your WaniKani profile. Your API token is only used to read your
                                    vocabulary list.
                                </Typography>
                            </Box>
                        }
                        placement="bottom"
                    >
                        <IconButton color="primary">
                            <HelpOutlineIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Box mt={4}>
                    <Comps.ClearCacheButton />
                </Box>

                {/* Behavior Settings */}
                <Box mt={4}>
                    <Typography variant="h6" fontWeight="600" gutterBottom>
                        2. Behavior
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Comps.AutoRunToggle />
                    <Comps.AudioToggle />
                    <Box mt={4} width="50%">
                        <Comps.SitesFilteringTable />
                    </Box>
                </Box>

                {/* Vocabulary Settings */}
                <Box mt={4}>
                    <Typography variant="h6" fontWeight="600" gutterBottom>
                        3. Vocabulary
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Comps.NumbersReplacementToggle />
                    <Box mt={4}>
                        <Comps.SRSCheckboxes />
                    </Box>
                    <Box mt={4}>
                        <Comps.CustomVocabularyTextArea />
                    </Box>
                    <Box mt={4}>
                        <Comps.VocabularyBlacklistTextArea />
                    </Box>
                    <Box mt={4}>
                        <Comps.SpreadsheetImportTable />
                    </Box>
                </Box>

                {/* Save Button */}
                <Divider sx={{ my: 4 }} />
                <Box mt={4}>
                    <Button color="primary" size="large">
                        Save
                    </Button>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default OptionsIndex;
