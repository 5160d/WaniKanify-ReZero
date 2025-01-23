// External Libraries
import React, { useCallback, type ReactElement } from "react";
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
  useTheme,
  Zoom
} from "@mui/material";
import { ThemeProvider } from '@mui/material/styles';

// Components
import {
  APITokenField, AutoRunToggle, AudioToggle,
  ClearCacheButton, CustomVocabularyTextArea, NumbersReplacementToggle,
  SRSCheckboxes, SitesFilteringTable, SpreadsheetImportTable,
  useWaniSettings, VocabularyBlacklistTextArea,
  saveButtonStyle
} from "src/components/settings";

// Hooks and Utils
import { useSystemTheme } from "src/hooks/systemTheme";

// Assets and Styles
import waniLogo from "data-base64:assets/icon.png";
import { waniStyle } from "src/styles/wanikanifyStyles";
import "src/styles/style.css";


interface HeaderProps {
  logo: string;
}

const Header = ({ logo }: HeaderProps): ReactElement => (
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
    }}>
    <img
      src={logo}
      alt="WaniKanify Logo"
      style={{ width: 96, height: 96 }}
    />
    <Typography
      variant="h4"
      fontWeight="bold"
      sx={{ color: 'primary.main' }}>
      WaniKanify Settings
    </Typography>
  </Stack>
);

interface FooterProps {
  githubUrl: string;
}

const Footer: React.FC<FooterProps> = ({ githubUrl }) => (
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
    }}
  >
    <Tooltip
      title="View on GitHub"
      TransitionComponent={Zoom}
      arrow
      PopperProps={{
        sx: {
          '& .MuiTooltip-tooltip': {
            bgcolor: 'primary.main',
            color: 'white',
            fontSize: '1rem',
            borderRadius: '10px',
            padding: '10px 20px',
            boxShadow: '0 0 20px rgba(0,0,0,0.2)',
            animation: 'tooltipPulse 1.5s infinite',
            '@keyframes tooltipPulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.05)' },
              '100%': { transform: 'scale(1)' }
            }
          },
          '& .MuiTooltip-arrow': {
            color: 'primary.main'
          }
        }
      }}
    >
      <IconButton
        onClick={() => window.open(githubUrl, '_blank', 'noopener')}
        aria-label="View source on GitHub"
        sx={{
          position: 'relative',
          transition: 'all 0.3s ease',
          '@keyframes pulse': {
            '0%': { transform: 'scale(0.95)', opacity: 0.5 },
            '70%': { transform: 'scale(1.1)', opacity: 0.3 },
            '100%': { transform: 'scale(0.95)', opacity: 0.5 }
          },
          '&:hover': {
            transform: 'scale(1.1) rotate(360deg)',
            color: 'primary.main',
            '& .MuiSvgIcon-root': {
              filter: 'drop-shadow(0 0 8px rgba(25,118,210,0.6))'
            }
          },
          '&:active': {
            transform: 'scale(0.95)'
          }
        }}
      >
        <GitHub
          fontSize="large"
          sx={{
            transition: 'all 0.3s ease'
          }}
        />
      </IconButton>
    </Tooltip>
  </Box>
);

export default function Options(): ReactElement {
  const mode = useSystemTheme();
  const theme = useTheme();
  const { settings, updateSettings, saveToStorage, isDirty } = useWaniSettings();

  // Use useCallback for event handlers
  const handleSave = useCallback(() => {
    saveToStorage();
  }, [saveToStorage]);

  return (
    <ThemeProvider theme={waniStyle(mode)}>
      <Box sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        transition: 'background-color 0.3s ease'
      }}>
        <Header logo={waniLogo} />
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
                      <APITokenField
                        value={settings.apiToken}
                        onChange={(newValue) => updateSettings({ apiToken: newValue })}
                      />
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
            {/* Save Button */}
            <Button
              variant="contained"
              color="primary"
              sx={saveButtonStyle}
              onClick={handleSave}
              disabled={!isDirty}
            >
              Save Changes
            </Button>
          </Box>
        </Box>
        <Footer githubUrl="https://github.com/5160d/WaniKanify-ReZero" />
      </Box>
    </ThemeProvider>
  );
}
