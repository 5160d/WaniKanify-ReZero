// External Libraries
import React, { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { GitHub, HelpOutline } from "@mui/icons-material";
import {
  Box,
  Stack,
  Typography,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Zoom
} from "@mui/material";
import { ThemeProvider } from '@mui/material/styles';

// Components
import {
  APITokenField,
  AutoRunToggle,
  AudioToggle,
  ClearCacheButton,
  CustomVocabularyTextArea,
  DEFAULT_SETTINGS_FORM_ERRORS,
  NumbersReplacementToggle,
  SaveButton,
  SRSCheckboxes,
  SitesFilteringTable,
  SpreadsheetImportTable,
  TooltipsToggle,
  PerformanceTelemetryToggle,
  useWaniSettings,
  VocabularyBlacklistTextArea
} from "src/components/settings";
import SettingsTools from "~src/components/settings/SettingsTools";
import SettingsPreview from "~src/components/settings/Preview";

// Hooks and Utils
import { useSystemTheme } from "~src/hooks";

// Assets and Styles
import waniLogo from "data-base64:assets/icon.png";
import { waniStyle } from "src/styles/wanikanifyStyles";
import "src/styles/style.css";
import { githubUrl } from "./components/common/constants";
import { WaniTooltip } from "./components/common/WaniTooltip";


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
  const {
    settingsForm,
    updateSettingsForm,
    saveToStorage,
    resetToDefaults,
    applyImportedSettings,
    forceSyncFromCloud,
    isDirty,
    saveStatus
  } = useWaniSettings();
  const [errors, setErrors] = useState({ ...DEFAULT_SETTINGS_FORM_ERRORS });
  const hasErrors = useMemo(() => Object.values(errors).some(Boolean), [errors]);
  const sections = ['General', 'Behavior', 'Vocabulary', 'Tools', 'Debug'] as const;

  // Reset errors when form is clean
  useEffect(() => {
    if (!isDirty) {
      setErrors({ ...DEFAULT_SETTINGS_FORM_ERRORS });
    }
    return () => {
      // Cleanup errors when component unmounts
      setErrors({ ...DEFAULT_SETTINGS_FORM_ERRORS });
    };
  }, [isDirty, setErrors]);

  useEffect(() => {
    const rawToken = settingsForm.apiToken?.trim() ?? "";
    const tokenPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const hasTokenError = rawToken.length > 0 && !tokenPattern.test(rawToken);

    setErrors((prev) => (prev.apiToken === hasTokenError ? prev : { ...prev, apiToken: hasTokenError }));
  }, [settingsForm.apiToken]);

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
          {sections.map((section, index) => (
            <Card key={section} sx={{ mb: 4 }}>
              <CardContent>
                {section === 'Vocabulary' ? (
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
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
                    <Tooltip
                      title={
                        <WaniTooltip title="Vocabulary">
                          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                            Section to customize the vocabulary replacement rules.
                          </Typography>
                          <Box sx={{
                          bgcolor: 'background.paper',
                          p: 2,
                          borderRadius: 1,
                          border: 1,
                          borderColor: 'divider',
                          maxWidth: '100%',
                          wordWrap: 'break-word'
                          }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            Filters are applied in order:<br/>
                            <code style={{ display: 'block', marginTop: '8px', backgroundColor: 'action.hover', padding: '2px 2px' }}>
                            Wanikanify Numbers &gt;<br/>
                            Blacklisted Vocabulary &gt;<br/>
                            Custom Vocabulary &gt;<br/>
                            Imported Vocabulary &gt;<br/>
                            SRS Groups
                            </code>
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
                        <HelpOutline sx={{ mt: -0.5 }}/>
                      </IconButton>
                    </Tooltip>
                  </Box>
                ) : (
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
                )}
                <Divider sx={{ mb: 3 }} />

                {section === 'General' && (
                  <>
                    <Box display="flex" alignItems="center" width="70%">
                      <APITokenField
                        value={settingsForm.apiToken}
                        onChange={(newValue) => updateSettingsForm({ apiToken: newValue })}
                        error={errors.apiToken}
                        helperText={errors.apiToken ? 'Token should match XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX format' : ''}
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
                      volume={settingsForm.audio.volume}
                      onEnabledChange={(enabled) => updateSettingsForm({ audio: { ...settingsForm.audio, enabled } })}
                      onModeChange={(mode) => updateSettingsForm({ audio: { ...settingsForm.audio, mode } })}
                      onVolumeChange={(volume) => updateSettingsForm({ audio: { ...settingsForm.audio, volume } })}
                    />
                    <TooltipsToggle
                      value={settingsForm.showReplacementTooltips}
                      onChange={(newValue) => updateSettingsForm({ showReplacementTooltips: newValue })}
                    />
                    <Box mt={3} width="50%">
                      <SitesFilteringTable
                        value={settingsForm.sitesFiltering}
                        onChange={(newValue) => updateSettingsForm({ sitesFiltering: newValue })}
                      />
                    </Box>
                    <Box mt={3}>
                      <SettingsPreview settingsForm={settingsForm} />
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
                      onChange={(newValue) => {
                        updateSettingsForm({ customVocabulary: newValue });
                      }}
                      onErrorHandled={(error) => setErrors((prev) => ({ ...prev, customVocabulary: error }))}
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

                {section === 'Debug' && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Enable telemetry to log matcher timing details to your local console for troubleshooting. No data leaves the browser.
                    </Typography>
                    <PerformanceTelemetryToggle
                      value={settingsForm.performanceTelemetry}
                      onChange={(newValue) => updateSettingsForm({ performanceTelemetry: newValue })}
                    />
                  </>
                )}

                {section === 'Tools' && (
                  <SettingsTools
                    settingsForm={settingsForm}
                    onImportSettings={(settings) => applyImportedSettings(settings)}
                    onValidationReset={() => setErrors({ ...DEFAULT_SETTINGS_FORM_ERRORS })}
                    onResetDefaults={() => {
                      resetToDefaults();
                      setErrors({ ...DEFAULT_SETTINGS_FORM_ERRORS });
                    }}
                    onSyncFromCloud={async () => {
                      await forceSyncFromCloud();
                    }}
                  />
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
            <SaveButton
              status={saveStatus}
              hasErrors={hasErrors}
              isDirty={isDirty}
              onClick={handleSave}
            />
          </Box>
        </Box>
        <Footer githubUrl={githubUrl} />
      </Box>
    </ThemeProvider>
  );
}

