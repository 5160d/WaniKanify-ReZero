import { Box, Button, Stack } from "@mui/material"
import { ThemeProvider } from '@mui/material/styles'
import React from "react"

import { APITokenField, saveButtonStyle, useWaniSettings } from "src/components/settings"
import { waniStyle } from "src/styles/wanikanifyStyles"
import "src/styles/style.css"

const POPUP_DIMENSIONS = {
  width: "500px",
  height: "286px"
}

const BACKGROUND_STYLES = {
  content: '""',
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundImage: "url('/assets/popup_background.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  opacity: 0.9,
  transition: 'opacity 0.3s ease'
} as const

const IndexPopup: React.FC = () => {
  const { settings, updateSettings, saveToStorage, isDirty } = useWaniSettings();
  
  const handleSave = React.useCallback(() => {
    saveToStorage();
  }, [saveToStorage]);

  return (
    <ThemeProvider theme={waniStyle('light')}>
      <Box
        sx={{
          ...POPUP_DIMENSIONS,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          "&::before": BACKGROUND_STYLES
        }}>
        <Stack 
          spacing={4} 
          alignItems="center"
          sx={{ 
            position: "relative",
            width: "100%",
          }}>
          <Box width="90%" sx={{bgcolor: 'background.paper'}}>
            <APITokenField 
              value={settings.apiToken}
              onChange={(value) => updateSettings({ apiToken: value })}
            />
          </Box>

          {/* Save Button */}
          <Button
            variant="contained"
            color="primary"
            sx={saveButtonStyle}
            onClick={handleSave}
            disabled={!isDirty}
          >
            Save
          </Button>
        </Stack>
      </Box>
    </ThemeProvider>
  );
};

export default IndexPopup
