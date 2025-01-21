import { Box, Button, Stack } from "@mui/material";
import { ThemeProvider } from '@mui/material/styles';
import React from "react";

import { APITokenField } from "src/components";
import { waniStyle } from "src/styles/wanikanifyStyles";
import "src/styles/style.css";

function IndexPopup() {

  return (
    <ThemeProvider theme={waniStyle('light')}>
      <Box
        sx={{
          width: "500px",
          height: "286px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          "&::before": {
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
          }
        }}
      >
        <Stack 
          spacing={4} 
          alignItems="center"
          sx={{ 
            position: "relative",
            width: "100%",
          }}
        >
          <Box sx={{bgcolor: 'background.paper'}}>
          <APITokenField />
          </Box>
          <Button
            variant="contained"
            color="primary"
            sx={{ 
              width: "20%",
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}
            onClick={() => console.log("Save clicked")}
          >
            Save
          </Button>
        </Stack>
      </Box>
    </ThemeProvider>
  );
}

export default IndexPopup;
