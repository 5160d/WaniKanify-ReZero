import { Box, Button, Stack } from "@mui/material";
import React, { useState } from "react";

import { APITokenField } from "src/components"

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
    </Box>
  );
}

export default IndexPopup;
