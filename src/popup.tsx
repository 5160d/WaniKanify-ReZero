import Button from "@mui/joy/Button";
import Stack from '@mui/joy/Stack';
import { CssVarsProvider } from '@mui/joy/styles';
import { Box } from "@mui/joy";
import React, { useState } from "react";

import { APITokenField } from "src/components"
import { wanikanifyTheme } from "~src/styles/wanikanify_theme";


function IndexPopup() {
  const [data, setData] = useState("");

  return (
    <Box
      sx={{
        width: "500px",
        height: "286px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('/assets/popup_background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <CssVarsProvider theme={wanikanifyTheme}>
        <form>
          <Stack spacing={4}>
            <APITokenField />
            <Button
              color="primary"
              sx={{ width: 50 }}
              onClick={() => console.log("Save clicked")}
            >
              Save
            </Button>
          </Stack>
        </form>
      </CssVarsProvider>
    </Box>
  );
}

export default IndexPopup;
