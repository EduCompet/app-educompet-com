// src/app/components/Loader.js
"use client";
import { Box } from "@mui/material";
import LottieLoader from "./LottieLoader";

export default function Loader({ contained = false }) {
  // Styles for the contained version of the loader
  const containedStyles = {
    position: "relative",
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "50vh", // Ensure it's visible
  };

  // Styles for the default fullscreen overlay version
  const fullscreenStyles = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    zIndex: 9999,
  };

  return (
    <Box sx={contained ? containedStyles : fullscreenStyles}>
      <Box sx={{ width: 150, height: 150 }}>
        {" "}
        {/* <-- Size changed here */}
        <LottieLoader />
      </Box>
    </Box>
  );
}