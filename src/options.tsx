// External Libraries
import React, { useCallback, useState, type ReactElement } from "react";
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
  Zoom
} from "@mui/material";
import { ThemeProvider } from '@mui/material/styles';

// Components
import {
  APITokenField, AutoRunToggle, AudioToggle,
  ClearCacheButton, CustomVocabularyTextArea, DEFAULT_SETTINGS_FORM_ERRORS, NumbersReplacementToggle,
  SRSCheckboxes, SitesFilteringTable, SpreadsheetImportTable,
  useWaniSettings, VocabularyBlacklistTextArea,
  saveButtonStyle
} from "src/components/settings";

// Hooks and Utils
import { useSystemTheme } from "~src/hooks";

// Assets and Styles
import waniLogo from "data-base64:assets/icon.png";
import { waniStyle } from "src/styles/wanikanifyStyles";
import "src/styles/style.css";
import { githubUrl } from "./components/common/constants";


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
      WaniKanify settingsForm
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
  const { settingsForm, updateSettingsForm, saveToStorage, isDirty } = useWaniSettings();
  const [errors] = useState(DEFAULT_SETTINGS_FORM_ERRORS);

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
                        value={settingsForm.apiToken}
                        onChange={(newValue) => updateSettingsForm({ apiToken: newValue })}
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
                      value={settingsForm.autoRun}
                      onChange={(newValue) => updateSettingsForm({ autoRun: newValue })}
                    />
                    <AudioToggle
                      enabled={settingsForm.audio.enabled}
                      mode={settingsForm.audio.mode}
                      onEnabledChange={(enabled) => updateSettingsForm({ audio: { ...settingsForm.audio, enabled } })}
                      onModeChange={(mode) => updateSettingsForm({ audio: { ...settingsForm.audio, mode } })}
                    />
                    <Box mt={3} width="50%">
                      <SitesFilteringTable
                        value={settingsForm.sitesFiltering}
                        onChange={(newValue) => updateSettingsForm({ sitesFiltering: newValue })}
                      />
                    </Box>
                  </>
                )}

                {section === 'Vocabulary' && (
                  <>
                    <NumbersReplacementToggle
                      value={settingsForm.numbersReplacement}
                      onChange={(newValue) => updateSettingsForm({ numbersReplacement: newValue })}
                    />
                    <Box mt={3}>
                      <SRSCheckboxes
                        value={settingsForm.srsGroups}
                        onChange={(newValue) => {
                          updateSettingsForm({ srsGroups: newValue });
                        }}
                      />
                    </Box>
                    <Box mt={3}>
                      <CustomVocabularyTextArea
                        value={settingsForm.customVocabulary}
                        onChange={(newValue, isValid) => {
                          errors.customVocabulary = !isValid;
                          updateSettingsForm({ customVocabulary: newValue });
                        }}
                      />
                    </Box>
                    <Box mt={3}>
                      <VocabularyBlacklistTextArea
                        value={settingsForm.vocabularyBlacklist}
                        onChange={(newValue) => updateSettingsForm({ vocabularyBlacklist: newValue })}
                      />
                    </Box>
                    <Box mt={3}>
                      <SpreadsheetImportTable
                        value={settingsForm.spreadsheetImport}
                        onChange={(newValue) => updateSettingsForm({ spreadsheetImport: newValue })}
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
              variant={Object.values(errors).some(error => error) ? "outlined" : "contained"}
              color="primary"
              sx={{
                ...saveButtonStyle,
                '&.Mui-disabled': {
                  color: Object.values(errors).some(error => error)
                    ? 'error.main'
                    : undefined
                }
              }}
              onClick={handleSave}
              disabled={!isDirty || Object.values(errors).some(error => error)}
            >
              Save Changes
            </Button>
          </Box>
        </Box>
        <Footer githubUrl={githubUrl} />
      </Box>
    </ThemeProvider>
  );
}
