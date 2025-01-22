import React, { useState } from "react"

import {
    Box, Button, Checkbox, Divider, FormControl, FormControlLabel, FormLabel, Stack, Switch,
    IconButton, Input, InputAdornment, List, ListItem,
    Radio, RadioGroup, Typography,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip
} from "@mui/material";
import { Delete, HelpOutline } from "@mui/icons-material";

import "src/styles/style.css"

const WaniTooltip = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Box sx={{ p: 2, maxWidth: 300 }}>
        <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
                color: 'primary.main',
                borderBottom: 1,
                borderColor: 'divider',
                pb: 1,
                mb: 2
            }}
        >
            {title}
        </Typography>
        <Box sx={{
            color: 'text.secondary',
            '& a': {
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                    textDecoration: 'underline'
                }
            }
        }}>
            {children}
        </Box>
    </Box>
);

export const APITokenField = () => {
    return (
        <Box display="flex" alignItems="center" gap={2} width="100%">
            <TextField
                required
                id="filled-required"
                label="API Token"
                variant="filled"
                fullWidth
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end" sx={{ mr: -1 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                endIcon={
                                    <Tooltip
                                        title={
                                            <WaniTooltip title="API Key">
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        mb: 2,
                                                        color: 'text.secondary'
                                                    }}
                                                >
                                                    Set your Token here.
                                                </Typography>
                                                <Box sx={{
                                                    bgcolor: 'background.paper',
                                                    p: 2,
                                                    borderRadius: 1,
                                                    border: 1,
                                                    borderColor: 'divider'
                                                }}>
                                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                                        You can generate a new API token on the{" "}
                                                        <a
                                                            href="https://www.wanikani.com/settings/personal_access_tokens"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            API Tokens section
                                                        </a>{" "}
                                                        of your WaniKani profile.
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        Your API token is only used to read your vocabulary list.
                                                    </Typography>
                                                </Box>
                                            </WaniTooltip>
                                        }
                                        placement="top"
                                        arrow
                                        PopperProps={{
                                            modifiers: [
                                                {
                                                    name: 'preventOverflow',
                                                    options: {
                                                        boundary: window,
                                                        altBoundary: true,
                                                        padding: 8
                                                    },
                                                },
                                                {
                                                    name: 'flip',
                                                    options: {
                                                        fallbackPlacements: ['top', 'left', 'right'],
                                                    },
                                                }
                                            ],
                                        }}
                                        sx={{
                                            '& .MuiTooltip-tooltip': {
                                                bgcolor: 'background.paper',
                                                boxShadow: 4,
                                                border: 1,
                                                borderColor: 'divider'
                                            }
                                        }}
                                    >
                                        <IconButton
                                            color="inherit"
                                            sx={{
                                                '&:hover': {
                                                    bgcolor: 'inherit.light',
                                                    color: 'inherit.contrastText'
                                                }
                                            }}
                                        >
                                            <HelpOutline />
                                        </IconButton>
                                    </Tooltip>
                                }
                            >
                                Test API Token
                            </Button>
                        </InputAdornment>
                    )
                }}
            />
        </Box>
    );
};

export const ClearCacheButton = () => {
    return (
        <Button color="warning" type="submit" name="clearButton"
            endIcon={
                <Tooltip
                    title={
                        <WaniTooltip title="Vocabulary Cache">
                            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                Delete local vocab and audio cache.
                            </Typography>
                            <Box sx={{
                                bgcolor: 'background.paper',
                                p: 2,
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider'
                            }}>
                                <Typography variant="body2">
                                    Your studied vocabulary words are cached locally to prevent overloading the WaniKani servers.
                                </Typography>
                                <Typography variant="body2">
                                    You may clear the cache manually by hitting this button.
                                    The cache will be repopulated automatically.
                                </Typography>
                            </Box>
                        </WaniTooltip>
                    }
                    placement="bottom"
                    arrow
                    sx={{
                        '& .MuiTooltip-tooltip': {
                            bgcolor: 'background.paper',
                            boxShadow: 4,
                            border: 1,
                            borderColor: 'divider'
                        }
                    }}
                >
                    <IconButton
                        color="inherit"
                        sx={{
                            '&:hover': {
                                bgcolor: 'inherit.light',
                                color: 'inherit.contrastText'
                            }
                        }}
                    >
                        <HelpOutline />
                    </IconButton>
                </Tooltip>
            }
        >
            Clear Cache
        </Button>
    );
};

export const AutoRunToggle = () => {
    return (
        <FormControl
            sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}
        >
            <FormControlLabel control={<Switch />} label="Auto WaniKanify Pages" />
            <Tooltip
                title={
                    <WaniTooltip title="Auto Run">
                        <Box sx={{
                            bgcolor: 'background.paper',
                            p: 2,
                            borderRadius: 1,
                            border: 1,
                            borderColor: 'divider'
                        }}>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                You may have WaniKanify run automatically after a page loads. Otherwise, click on the extension icon to run it.
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                With both settings, clicking the extension will return the page to its original state.
                            </Typography>
                        </Box>
                    </WaniTooltip>
                }
                placement="bottom"
                arrow
                sx={{
                    '& .MuiTooltip-tooltip': {
                        bgcolor: 'background.paper',
                        boxShadow: 4,
                        border: 1,
                        borderColor: 'divider'
                    }
                }}
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
        </FormControl>
    );
};


export const AudioToggle = () => {
    const [isToggled, setIsToggled] = useState(false);

    return (
        <Stack display="flex" direction="row" spacing={2} alignItems="center" p={2}>
            <FormControl sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
                {/* Toggle Switch */}
                <FormControlLabel control={<Switch onChange={(e) => setIsToggled(e.target.checked)} />} label="Play Audio" />
                {/* Tooltip */}
                <Tooltip
                    title={
                        <WaniTooltip title="Optional Audio">
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Mousing over a word or clicking it will audibly play its pronunciation.
                            </Typography>
                        </WaniTooltip>
                    }
                    placement="bottom"
                    arrow
                    sx={{
                        '& .MuiTooltip-tooltip': {
                            bgcolor: 'background.paper',
                            boxShadow: 4,
                            border: 1,
                            borderColor: 'divider'
                        }
                    }}
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
            </FormControl>
            {/* Divider */}
            <Divider orientation="vertical" sx={{ height: "32px" }} />
            {/* Conditionally Enable RadioGroup */}
            <RadioGroup row name="audioMode" sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1, }}>
                <FormControlLabel
                    value="click"
                    control={<Radio disabled={!isToggled} id="audioClick" />}
                    label="Click"
                />
                <FormControlLabel
                    value="hover"
                    control={<Radio disabled={!isToggled} id="audioHover" />}
                    label="Hover"
                />
            </RadioGroup>
        </Stack>
    );
};

export const SitesFilteringTable = () => {
    // State for the list of websites
    const [websites, setWebsites] = useState([]);
    // State for the current input value
    const [newWebsite, setNewWebsite] = useState("");

    const handleAddWebsite = () => {
        // Prevent adding empty rows
        if (!newWebsite.trim()) return;

        // Add the new website to the list
        setWebsites([...websites, newWebsite]);
        // Clear the input field
        setNewWebsite("");
    };

    const handleDeleteWebsite = (index) => {
        // Remove the website at the given index
        setWebsites(websites.filter((_, i) => i !== index));
    };

    return (
        <Box>
            {/* Header with Tooltip */}
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Filtered Websites
                </Typography>
                <Tooltip
                    title={
                        <WaniTooltip title="Filtered Websites">
                            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                Block WaniKanify on those websites.
                            </Typography>
                            <Box sx={{
                                bgcolor: 'background.paper',
                                p: 2,
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider'
                            }}>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    WaniKanify will not run on the sites below. Use regular expressions for URL
                                    patterns. A site is filtered out if any pattern matches the URL.
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Be sure to click the save button to save any changes to this list.
                                </Typography>
                            </Box>
                        </WaniTooltip>
                    }
                    placement="bottom"
                    arrow
                    sx={{
                        '& .MuiTooltip-tooltip': {
                            bgcolor: 'background.paper',
                            boxShadow: 4,
                            border: 1,
                            borderColor: 'divider'
                        }
                    }}
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
            {/* Table */}
            <Box
                sx={{
                    border: "1px solid",
                    borderColor: "neutral.outlinedBorder",
                    borderRadius: "8px",
                    overflowX: "auto",
                }}
            >
                <TableContainer sx={{ maxHeight: 440 }}>
                    <Table
                        sx={{
                            border: '1px solid rgba(224, 224, 224, 1)', // Adds border to the table
                            '& TableBody TableRow:nth-of-type(odd)': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)', // Striped effect
                            },
                            '& TableBody TableRow:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.08)', // Hover effect
                            },
                        }}
                    >
                        <TableBody>
                            {/* Dynamically Render Rows */}
                            {websites.map((website, index) => (
                                <TableRow hover key={index}>
                                    <TableCell style={{ whiteSpace: 'nowrap' }}>{website}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            color="error"
                                            size="small"
                                            onClick={() => handleDeleteWebsite(index)}
                                            aria-label="Delete"
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {/* Input Row */}
                            <TableRow hover>
                                <TableCell>
                                    <Input
                                        placeholder="^https?:\/\/(www\.)?example\.com(\/.*)?$"
                                        value={newWebsite}
                                        onChange={(e) => setNewWebsite(e.target.value)}
                                        fullWidth
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Button
                                        color="primary"
                                        variant="contained"
                                        onClick={handleAddWebsite}
                                        disabled={!newWebsite.trim()}
                                    >
                                        Add
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

export const NumbersReplacementToggle = () => {
    return (
        <Box display="flex" alignItems="center" gap={2}>
            {/* Toggle Switch */}
            <FormControl
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <FormControlLabel control={<Switch />} label="WaniKanify Numbers" />
            </FormControl>
            <Tooltip
                title={
                    <WaniTooltip title="WaniKanify Numbers">
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Toggle on for numerical numbers to be replaced with Kanji as well.
                        </Typography>
                    </WaniTooltip>
                }
                placement="bottom"
                arrow
                sx={{
                    '& .MuiTooltip-tooltip': {
                        bgcolor: 'background.paper',
                        boxShadow: 4,
                        border: 1,
                        borderColor: 'divider'
                    }
                }}
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
    );
};

export const SRSCheckboxes = () => {
    return (
        <Box>
            {/* Header with Tooltip */}
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h6" fontWeight="lg">
                    SRS groups
                </Typography>
                <Tooltip
                    title={
                        <WaniTooltip title="SRS Filtering">
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                WaniKanify will only substitute words in the checked SRS groups.
                            </Typography>
                        </WaniTooltip>
                    }
                    placement="bottom"
                    arrow
                    sx={{
                        '& .MuiTooltip-tooltip': {
                            bgcolor: 'background.paper',
                            boxShadow: 4,
                            border: 1,
                            borderColor: 'divider'
                        }
                    }}
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

            {/* List of Checkboxes */}
            <List
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    border: "1px solid",
                    borderColor: "neutral.outlinedBorder",
                    borderRadius: "md",
                    overflow: "hidden",
                    divideY: "1px solid",
                    divideColor: "neutral.outlinedBorder",
                }}
            >
                {[
                    { label: "Apprentice", defaultChecked: false },
                    { label: "Guru", defaultChecked: true },
                    { label: "Master", defaultChecked: true },
                    { label: "Enlightened", defaultChecked: true },
                    { label: "Burned", defaultChecked: false },
                ].map((group, index) => (
                    <ListItem key={index} sx={{ p: 2, display: "flex", alignItems: "center" }}>
                        <FormControl
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                flexGrow: 1,
                            }}
                        >
                            <Checkbox
                                defaultChecked={group.defaultChecked}
                                color="primary"
                                size="medium"
                                sx={{ mr: 2 }}
                            />
                            <FormLabel>{group.label}</FormLabel>
                        </FormControl>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export const CustomVocabularyTextArea = () => {
    return (
        <Box width="100%">
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h6" fontWeight="lg">
                    Custom Vocabulary
                </Typography>
                <Tooltip
                    title={
                        <WaniTooltip title="Custom Vocabulary">
                            <Typography
                                variant="body2"
                                sx={{
                                    mb: 2,
                                    color: 'text.secondary'
                                }}
                            >
                                This overrides Wanikani vocab.
                            </Typography>
                            <Box sx={{
                                bgcolor: 'background.paper',
                                p: 2,
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider'
                            }}>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                    Format:
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    eng1,eng2,...;vocab;reading
                                </Typography>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                    Example:
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontFamily: 'monospace',
                                        bgcolor: 'action.hover',
                                        p: 1,
                                        borderRadius: 0.5
                                    }}
                                >
                                    cat,feline;猫;ねこ
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 2 }}>
                                    • Separate entries with ':'
                                    <br />
                                    • Reading is optional (for audio)
                                </Typography>
                            </Box>
                        </WaniTooltip>
                    }
                    placement="bottom-start"
                    arrow
                    sx={{
                        '& .MuiTooltip-tooltip': {
                            bgcolor: 'background.paper',
                            boxShadow: 4,
                            border: 1,
                            borderColor: 'divider'
                        }
                    }}
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
            <TextField
                id="customVocabulary"
                placeholder="cat,feline:猫:ねこ;cold:寒い:さむい"
                multiline
                minRows={4}
                sx={{ resize: "vertical", overflow: 'auto' }}
                fullWidth
            />
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                Failed to parse the list
            </Typography>
            <Typography variant="body2" color="success" sx={{ mt: 1 }}>
                Custom Vocabulary list applied.
            </Typography>
        </Box>
    );
};

export const VocabularyBlacklistTextArea = () => {
    return (
        <Box width="100%">
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h6" fontWeight="lg">
                    Blacklisted Vocabulary
                </Typography>
                <Tooltip
                    title={
                        <WaniTooltip title="Blacklisted Vocabulary">
                            <Box sx={{
                                bgcolor: 'background.paper',
                                p: 2,
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider'
                            }}>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Vocabulary on this list will not be replaced in the pages.
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Vocabulary must be semicolon-separated.
                                </Typography>
                            </Box>
                        </WaniTooltip>
                    }
                    placement="bottom"
                    arrow
                    sx={{
                        '& .MuiTooltip-tooltip': {
                            bgcolor: 'background.paper',
                            boxShadow: 4,
                            border: 1,
                            borderColor: 'divider'
                        }
                    }}
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
            <TextField
                id="vocabularyBlacklist"
                placeholder="in;I;why;time"
                multiline
                minRows={4}
                sx={{ resize: "vertical", overflow: 'auto' }}
                fullWidth
            />
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                Failed to parse the list
            </Typography>
            <Typography variant="body2" color="success" sx={{ mt: 1 }}>
                Vocabulary Blacklist applied.
            </Typography>
        </Box>
    );
};

export const SpreadsheetImportTable = () => {
    interface SpreadSheet {
        collectionKey: string;
        spreadSheetName: string;
        englishColumn: string;
        japaneseColumn: string;
        readingColumn: string;
        delimiter: string;
    }

    const [spreadsheets, setSpreadsheets] = useState<SpreadSheet[]>([]);
    const [newSpreadsheet, setNewSpreadsheet] = useState<SpreadSheet>({
        collectionKey: "",
        spreadSheetName: "",
        englishColumn: "",
        japaneseColumn: "",
        readingColumn: "",
        delimiter: "",
    });

    const handleAddSpreadsheet = () => {
        if (
            !newSpreadsheet.collectionKey.trim() ||
            !newSpreadsheet.spreadSheetName.trim() ||
            !newSpreadsheet.englishColumn.trim() ||
            !newSpreadsheet.japaneseColumn.trim() ||
            !newSpreadsheet.readingColumn.trim() ||
            !newSpreadsheet.delimiter.trim()
        )
            return;

        setSpreadsheets([...spreadsheets, newSpreadsheet]);
        setNewSpreadsheet({
            collectionKey: "",
            spreadSheetName: "",
            englishColumn: "",
            japaneseColumn: "",
            readingColumn: "",
            delimiter: "",
        });
    };

    const handleDeleteSpreadsheet = (index: number) => {
        setSpreadsheets(spreadsheets.filter((_, i) => i !== index));
    };

    return (
        <Box>
            {/* Header */}
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h6" fontWeight="lg">
                    Imported Vocabulary
                </Typography>
                <Tooltip
                    title={
                        <Box sx={{
                            p: 2,
                            width: 800,
                            maxWidth: '90vw',
                            bgcolor: 'background.tooltip',
                            borderRadius: 1,
                        }}>
                            <Typography
                                variant="h6"
                                fontWeight="bold"
                                sx={{
                                    color: 'primary.main',
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    pb: 1,
                                    mb: 2
                                }}
                            >
                                Vocabulary Spreadsheets
                            </Typography>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 2fr',
                                gap: 3
                            }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Import vocabulary from Google Spreadsheets published on the Web.
                                    <Typography variant="body2" sx={{ mt: 2 }}>
                                        To publish the spreadsheet: <em>File{'->'}Share{'->'}Publish to web</em>.
                                    </Typography>
                                </Typography>
                                <Box sx={{
                                    bgcolor: 'background.paper',
                                    p: 2,
                                    borderRadius: 1,
                                    border: 1,
                                    borderColor: 'divider'
                                }}>
                                    <Typography variant="body2" component="div" sx={{ mt: 2, color: 'text.secondary' }}>
                                        <strong>1. Spreadsheet collection key:</strong> The spreadsheet collection (group of sheets) unique key. Found in its URL and similar to this:<br />
                                        <code style={{ backgroundColor: 'action.hover', padding: '2px 4px' }}>
                                            1lIo2calXb_GtaQCKLr989-Ma_hxXlxFsHE0egko-D9k
                                        </code>
                                        <br />
                                        <strong>2. Spreadsheet name:</strong> Name of the selected tab at the bottom of the spreadsheet.<br />
                                        <strong>3. English words column name:</strong> The name of the column containing english words.<br />
                                        <strong>4. Japanese words column name:</strong> The name of the column containing Kanji/japanese words.<br />
                                        <strong>5. Japanese readings column name:</strong> Optional column name containing furigana readings.<br />
                                        <strong>6. English words delimiter:</strong> Delimiter for multiple English words (default: comma).
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                                        Note: Google Chrome Sync synchronizes the list of spreadsheets but not the vocabulary. Click import on each different browser.
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    }
                    placement="top"
                    arrow
                    PopperProps={{
                        modifiers: [
                            {
                                name: 'preventOverflow',
                                options: {
                                    boundary: window,
                                    altBoundary: true,
                                    padding: 8
                                },
                            },
                            {
                                name: 'flip',
                                options: {
                                    fallbackPlacements: ['top', 'left', 'right'],
                                },
                            }
                        ],
                    }}
                    sx={{
                        '& .MuiTooltip-tooltip': {
                            bgcolor: 'background.paper',
                            boxShadow: 4,
                            border: 1,
                            borderColor: 'divider'
                        }
                    }}
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
            <TableContainer sx={{ maxHeight: 440, overflowX: "auto", border: "1px solid", borderColor: "neutral.outlinedBorder", borderRadius: "md" }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Spreadsheet Collection Key</TableCell>
                            <TableCell>Spreadsheet Name</TableCell>
                            <TableCell>English Words Column Name</TableCell>
                            <TableCell>Japanese Words Column Name</TableCell>
                            <TableCell>Japanese Readings Column Name</TableCell>
                            <TableCell>English Words Delimiter</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {spreadsheets.map((spreadsheet, index) => (
                            <TableRow key={index}>
                                <TableCell>{spreadsheet.collectionKey}</TableCell>
                                <TableCell>{spreadsheet.spreadSheetName}</TableCell>
                                <TableCell>{spreadsheet.englishColumn}</TableCell>
                                <TableCell>{spreadsheet.japaneseColumn}</TableCell>
                                <TableCell>{spreadsheet.readingColumn}</TableCell>
                                <TableCell>{spreadsheet.delimiter}</TableCell>
                                <TableCell>
                                    <Button size="small" variant="contained" color="primary">
                                        Import
                                    </Button>
                                    <IconButton size="small" color="error" onClick={() => handleDeleteSpreadsheet(index)}>
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell>
                                <Input
                                    placeholder="1lIo2calXb_GtaQCMLr989_Ma_hxXlxFsHE0egko-D9k"
                                    value={newSpreadsheet.collectionKey}
                                    onChange={(e) => setNewSpreadsheet({ ...newSpreadsheet, collectionKey: e.target.value })}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    placeholder="6k Pt 1"
                                    value={newSpreadsheet.spreadSheetName}
                                    onChange={(e) => setNewSpreadsheet({ ...newSpreadsheet, spreadSheetName: e.target.value })}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    placeholder="English"
                                    value={newSpreadsheet.englishColumn}
                                    onChange={(e) => setNewSpreadsheet({ ...newSpreadsheet, englishColumn: e.target.value })}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    placeholder="Japanese"
                                    value={newSpreadsheet.japaneseColumn}
                                    onChange={(e) => setNewSpreadsheet({ ...newSpreadsheet, japaneseColumn: e.target.value })}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    placeholder="Reading"
                                    value={newSpreadsheet.readingColumn}
                                    onChange={(e) => setNewSpreadsheet({ ...newSpreadsheet, readingColumn: e.target.value })}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    placeholder=","
                                    value={newSpreadsheet.delimiter}
                                    onChange={(e) => setNewSpreadsheet({ ...newSpreadsheet, delimiter: e.target.value })}
                                />
                            </TableCell>
                            <TableCell>
                                <Button size="small" variant="contained" onClick={handleAddSpreadsheet}>
                                    Add
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
