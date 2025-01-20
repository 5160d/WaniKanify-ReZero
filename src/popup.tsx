import Button from "@mui/joy/Button";
import Stack from '@mui/joy/Stack';
import { CssVarsProvider } from '@mui/joy/styles';
import { Box } from "@mui/joy";
import React, { useState } from "react";

import { APITokenField } from "src/components"
import { WanikanifyTheme } from "src/styles/wanikanify_theme";

import "src/styles/style.css"


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
    </Box>
  );
}

export default IndexPopup;
