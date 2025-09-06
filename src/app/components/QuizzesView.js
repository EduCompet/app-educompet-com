// src/app/components/QuizzesView.js
"use client";

import {
  Typography,
  Box,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from "@mui/material";
import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";

const QuizzesView = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Quiz Management
      </Typography>

      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Coming Soon!</Typography>
        <Typography color="text.secondary">
          The interface to create, manage, and review quizzes will be available here.
        </Typography>
      </Paper>

      <Fab
        variant="extended"
        color="primary"
        aria-label="add quiz"
        sx={{ position: "fixed", bottom: 40, right: 40 }}
        onClick={() => setIsModalOpen(true)}
      >
        <AddIcon sx={{ mr: 1 }} />
        Add Quiz
      </Fab>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogTitle>Create New Quiz</DialogTitle>
        <DialogContent>
          <Typography>
            The form to add a new quiz will be implemented here.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizzesView;