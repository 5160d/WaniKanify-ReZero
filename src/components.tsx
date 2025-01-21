import React, { useState } from "react"

import {
    Box, Button, Checkbox, FormControl, FormControlLabel, FormLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip,
    IconButton, Input, InputAdornment, List, ListItem,
    Radio, RadioGroup, Typography, Divider
} from "@mui/material";
import { HelpOutline, Delete } from "@mui/icons-material";

import "src/styles/style.css"


export const APITokenField = () => {
    return (
        <TextField
            placeholder="API Token"
            variant="outlined"
            fullWidth
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <Button variant="contained" color="primary">
                            Test API Token
                        </Button>
                    </InputAdornment>
                )
            }}
        />
    );
};

export const ClearCacheButton = () => {
    return (
        <Box display="flex" alignItems="center" gap={2}>
            {/* Clear Cache Button */}
            <Button color="warning" type="submit" name="clearButton">
                Clear Cache
            </Button>

            {/* Tooltip */}
            <Tooltip
                title={
                    <Box>
                        <Typography
                            variant="body1"
                            sx={{ fontWeight: 'bold' }}
                        >
                            Vocabulary Cache
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Your studied vocabulary words are cached locally to prevent overloading the WaniKani servers.
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            You may clear the cache manually by hitting this button. The cache will be repopulated automatically.
                        </Typography>
                    </Box>
                }
                placement="bottom"
            >
                <IconButton color="primary">
                    <HelpOutline />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export const AutoRunToggle = () => {
    return (
        <Box display="flex" alignItems="center" gap={2}>
            {/* Toggle Switch */}
            <FormControl
                sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
            >
                <Checkbox
                    id="autoRunSwitch"
                    color="primary"
                    inputProps={{ 'aria-label': 'Auto WaniKanify Pages' }}
                    sx={{ border: '1px solid', borderColor: 'currentColor', borderRadius: '4px' }}
                />
                <FormLabel htmlFor="autoRunSwitch" sx={{ ml: 1, fontSize: '1rem' }} >
                    Auto WaniKanify Pages
                </FormLabel>
            </FormControl>


            {/* Tooltip */}
            <Tooltip
                title={
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            Auto Run
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            You may have WaniKanify run automatically after a page loads. Otherwise, click on the extension icon to run it.
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            With both settings, clicking the extension will return the page to its original state.
                        </Typography>
                    </Box>
                }
                placement="bottom"
            >
                <IconButton color="primary">
                    <HelpOutline />
                </IconButton>
            </Tooltip>
        </Box>
    );
};


export const AudioToggle = () => {
    const [isToggled, setIsToggled] = useState(false);

    return (
        <Box display="flex" alignItems="center" gap={2}>
            {/* Audio Toggle */}
            <FormControl sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }} >
                <Checkbox
                    id="audioSwitch"
                    checked={isToggled}
                    onChange={(e) => setIsToggled(e.target.checked)}
                    color="primary"
                    sx={{
                        border: '1px solid',
                        borderColor: 'currentColor',
                        borderRadius: '4px'
                    }}
                />
                <FormLabel
                    htmlFor="audioSwitch"
                >
                    Play Audio
                </FormLabel>
            </FormControl>


            {/* Tooltip */}
            <Tooltip
                title={
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            Optional Audio
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Mousing over a word or clicking it will audibly play its pronunciation.
                        </Typography>
                    </Box>
                }
                placement="bottom"
            >
                <IconButton color="primary">
                    <HelpOutline />
                </IconButton>
            </Tooltip>

            {/* Divider */}
            <Divider orientation="vertical" sx={{ height: "32px" }} />

            {/* Conditionally Render RadioGroup */}
            <FormControl>
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                        p: 1,
                    }}
                >
                    <RadioGroup
                        row // Ensures horizontal orientation
                        name="audioMode"
                    >
                        <FormControlLabel
                            value="click"
                            control={<Radio checked={isToggled} id="audioClick" />}
                            label="Click"
                        />
                        <FormControlLabel
                            value="hover"
                            control={<Radio disabled={!isToggled} id="audioHover" />}
                            label="Hover"
                        />
                    </RadioGroup>
                </Box>

            </FormControl>
        </Box>
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
                        <Box>
                            <Typography variant="h5" fontWeight="bold">
                                Filtered Websites
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                WaniKanify will not run on the sites below. Use regular expressions for URL
                                patterns. A site is filtered out if any pattern matches the URL.
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Be sure to click the save button to save any changes to this list.
                            </Typography>
                        </Box>
                    }
                    placement="bottom"
                >
                    <IconButton color="primary">
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


                <TableContainer>
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
                <Checkbox id="userSwitch" color="primary" />
                <FormLabel htmlFor="userSwitch" sx={{ ml: 1, fontSize: "1rem" }}>
                    WaniKanify Numbers
                </FormLabel>
            </FormControl>

            {/* Tooltip */}
            <Tooltip
                title={
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            WaniKanify Numbers
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Toggle on for numerical numbers to be replaced with Kanji as well.
                        </Typography>
                    </Box>
                }
                placement="bottom"
            >
                <IconButton color="primary">
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
                        <Box>
                            <Typography variant="h5" fontWeight="bold">
                                SRS Filtering
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                WaniKanify will only substitute words in the checked SRS groups.
                            </Typography>
                        </Box>
                    }
                    placement="bottom"
                >
                    <IconButton color="primary">
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
                        <Box>
                            <Typography variant="h5" fontWeight="bold">
                                Custom Vocabulary
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                This overrides Wanikani vocab.
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Format: eng1,eng2,...;vocab;reading
                                <br />
                                Example: cat,feline;猫;ねこ
                                <br />
                                Separate entries with ':'
                                <br />
                                The reading is for audio functionality (optional).
                            </Typography>
                        </Box>
                    }
                    placement="bottom"
                >
                    <IconButton color="primary">
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
                        <Box>
                            <Typography variant="h5" fontWeight="bold">
                                Blacklisted Vocabulary
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Vocabulary on this list will not be replaced in the pages.
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Vocabulary must be semicolon-separated.
                            </Typography>
                        </Box>
                    }
                    placement="bottom"
                >
                    <IconButton color="primary">
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
                        <Box>
                            <Typography variant="h5" fontWeight="bold">
                                Vocabulary Spreadsheets
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Import vocabulary from Google Spreadsheets published on the Web.
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                To publish the spreadsheet: <em>File-{">"}Share-{">"}Publish to web</em>.
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                <strong>1. Spreadsheet collection key:</strong> The spreadsheet collection {"("}group of sheets{")"} unique key. Found in its URL, it looks similar to:
                                <em>1lIo2calXb_GtaQCKLr989-Ma_hxXlxFsHE0egko-D9k</em><br />
                                <strong>2. Spreadsheet name:</strong> Name of the selected tab at the bottom of the spreadsheet.<br />
                                <strong>3. English words column name:</strong> The name of the column {"("}in the spreadsheet header{")"} that contains the english words.<br />
                                <strong>4. Japanese words column name:</strong> The name of the column {"("}in the spreadsheet header{")"} that contains the corresponding Kanji/japanese words.<br />
                                <strong>5. Japanese readings column name:</strong> Optionally, the name of the column (in the spreadsheet header) that contains the corresponding furigana readings for the audio feature.<br />
                                <strong>6. English words delimiter:</strong> Delimiter used in the English column to separate multiple words associated to a same Japanese one {"("}default is a comma{")"}.
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Google Chrome Sync synchronizes the list of spreadsheets but not the vocabulary. Click import on each different browser.
                            </Typography>
                        </Box>
                    }
                    placement="bottom"
                >
                    <IconButton color="primary">
                        <HelpOutline />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Table */}
            <Box sx={{ overflowX: "auto", border: "1px solid", borderColor: "neutral.outlinedBorder", borderRadius: "md" }}>
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
                                    placeholder="Collection Key"
                                    value={newSpreadsheet.collectionKey}
                                    onChange={(e) => setNewSpreadsheet({ ...newSpreadsheet, collectionKey: e.target.value })}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    placeholder="Spreadsheet Name"
                                    value={newSpreadsheet.spreadSheetName}
                                    onChange={(e) => setNewSpreadsheet({ ...newSpreadsheet, spreadSheetName: e.target.value })}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    placeholder="English Column"
                                    value={newSpreadsheet.englishColumn}
                                    onChange={(e) => setNewSpreadsheet({ ...newSpreadsheet, englishColumn: e.target.value })}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    placeholder="Japanese Column"
                                    value={newSpreadsheet.japaneseColumn}
                                    onChange={(e) => setNewSpreadsheet({ ...newSpreadsheet, japaneseColumn: e.target.value })}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    placeholder="Reading Column"
                                    value={newSpreadsheet.readingColumn}
                                    onChange={(e) => setNewSpreadsheet({ ...newSpreadsheet, readingColumn: e.target.value })}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    placeholder="Delimiter"
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
            </Box>
        </Box>
    );
};
