// app/(admin)/components/DashboardView.js
import { Typography, Box } from "@mui/material";

export default function DashboardView() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography>
        Welcome to the admin dashboard. Here you can get an overview of your
        application&apos;s activity.
      </Typography>
    </Box>
  );
}