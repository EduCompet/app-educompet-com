// src/app/components/NotificationsView.js
"use client";

import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Divider,
  Alert,
} from "@mui/material";
import { useState, useEffect, useCallback } from "react"; // Import useCallback
import Loader from "./Loader";
import WorkIcon from "@mui/icons-material/Work";
import CampaignIcon from "@mui/icons-material/Campaign";

// A helper function to format the date
const formatSentTime = (dateString) => {
  const options = {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  };
  return new Date(dateString).toLocaleString('en-US', options);
};

const NotificationIcon = ({ type }) => {
  switch (type) {
    case "Job_update":
      return <WorkIcon />;
    default:
      return <CampaignIcon />;
  }
};

const NotificationsView = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${baseURL}/api/coreNotificationData`, {
        method: "GET",
        headers: { "x-api-key": apiKey },
      });
      const result = await response.json();
      if (result.success) {
        // Sort notifications by most recent first
        const sortedNotifications = result.data.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        setNotifications(sortedNotifications);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to fetch notifications.");
    } finally {
      setLoading(false);
    }
  }, [apiKey, baseURL]); // Add dependencies for useCallback

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]); // Add fetchNotifications to the dependency array

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Notifications
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Loader contained />
      ) : (
        <Paper elevation={0} variant="outlined">
          <List disablePadding>
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <div key={notification._id}>
                  <ListItem sx={{ p: 2 }}>
                    <ListItemIcon sx={{ mr: 1 }}>
                      <NotificationIcon type={notification.notificationType} />
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.title}
                      secondary={notification.message}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                     <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-start', minWidth: '150px', textAlign: 'right' }}>
                        {formatSentTime(notification.sentAt)}
                    </Typography>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </div>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No notifications found." sx={{ textAlign: 'center', p: 4 }} />
              </ListItem>
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default NotificationsView;