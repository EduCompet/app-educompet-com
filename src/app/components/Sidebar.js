// src/app/components/Sidebar.js
"use client";

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Divider,
  Box,
} from "@mui/material";

// Import all the necessary icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import SchoolIcon from "@mui/icons-material/School";
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import GroupIcon from "@mui/icons-material/Group";
import SubscriptionsIcon from "@mui/icons-material/Subscriptions";
import WorkIcon from "@mui/icons-material/Work";
import NotificationsIcon from "@mui/icons-material/Notifications";
import QuizIcon from '@mui/icons-material/Quiz'; // <-- Import Quiz Icon


const menuItems = [
    { name: "Dashboard", icon: <DashboardIcon /> },
    { name: "Classes & Subjects", icon: <SchoolIcon /> },
    { name: "Content Management", icon: <VideoLibraryIcon /> },
    { name: "Students", icon: <GroupIcon /> },
    { name: "Subscriptions", icon: <SubscriptionsIcon /> },
    { name: "Quizzes", icon: <QuizIcon /> }, // <-- Add Quizzes to the menu
    { name: "Job Updates", icon: <WorkIcon /> },
    { name: "Notifications", icon: <NotificationsIcon /> },
];

export default function Sidebar({
  mobileOpen,
  handleDrawerToggle,
  drawerWidth,
  activeView,
  handleViewChange,
}) {
  const drawerContent = (
    <div>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ mr: 1.5, p: 1, borderRadius: '50%', backgroundColor: 'rgba(59,130,246,0.2)'}}>
            <SchoolIcon sx={{ color: '#60A5FA' }}/>
        </Box>
        <div>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
             EDUCOMPET Admin
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
             Manage your educational content
            </Typography>
        </div>
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mt: 1 }} />
      <List sx={{ px: 1, mt: 2 }}>
        {menuItems.map((item) => {
          const selected = activeView === item.name;
          return (
            <ListItem
              key={item.name}
              disablePadding
              onClick={() => handleViewChange(item.name)}
            >
              <ListItemButton
                selected={selected}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  mb: 0.5,
                  color: "rgba(255,255,255,0.8)",
                  "& .MuiListItemIcon-root": {
                    color: "rgba(255,255,255,0.6)",
                    minWidth: 40,
                  },
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: "#fff",
                    "& .MuiListItemIcon-root": { color: "#fff" },
                  },
                  "&.Mui-selected": {
                    backgroundColor: "rgba(59,130,246,0.2)",
                    color: "#fff",
                    "& .MuiListItemIcon-root": { color: "#60A5FA" },
                  },
                  "&.Mui-selected:hover": {
                    backgroundColor: "rgba(59,130,246,0.28)",
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{
                    fontWeight: selected ? 600 : 500,
                    fontSize: "0.9rem",
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            backgroundColor: "#111827",
            color: "white",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            backgroundColor: "#111827",
            color: "white",
            borderRight: "1px solid rgba(255,255,255,0.08)",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}