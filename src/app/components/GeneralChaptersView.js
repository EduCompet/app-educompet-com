// src/app/components/GeneralChaptersView.js
"use client";

import {
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from '@mui/icons-material/Edit';
import Loader from "./Loader";

const GeneralChaptersView = ({ generalSubjectId, generalSubjectName, onBack }) => {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [chapterName, setChapterName] = useState("");
  const [adminId, setAdminId] = useState(null);

  // States for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedChapterName, setEditedChapterName] = useState("");
  const [chapterToEdit, setChapterToEdit] = useState(null);

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

  const fetchChapters = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = `${baseURL}/api/getGeneralChapterDataWithSubjectId?generalSubjectId=${generalSubjectId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "x-api-key": apiKey },
      });
      const result = await response.json();
      if (result.success) {
        setChapters(result.data);
      } else {
        if (response.status !== 404) {
            setError(result.message);
        }
        setChapters([]);
      }
    } catch (err) {
      setError("Failed to fetch chapters.");
    } finally {
      setLoading(false);
    }
  }, [apiKey, baseURL, generalSubjectId]);

  useEffect(() => {
    const id = sessionStorage.getItem("adminId");
    if (id) setAdminId(id);
    if (generalSubjectId) fetchChapters();
  }, [generalSubjectId, fetchChapters]);

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!adminId) {
      setError("Admin ID not found. Please log in again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${baseURL}/api/postGeneralChapterData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          name: chapterName,
          generalSubjectId: generalSubjectId,
          createdBy: adminId,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setChapterName("");
        setIsAddDialogOpen(false);
        fetchChapters();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An error occurred while adding the chapter.");
    } finally {
      setLoading(false);
    }
  };

  const updateChapter = async (chapterId, updateData) => {
    const originalChapters = [...chapters];
    const updatedChapters = chapters.map((c) =>
      c._id === chapterId ? { ...c, ...updateData } : c
    );
    setChapters(updatedChapters);
    setError("");

    try {
      const url = `${baseURL}/api/putGeneralChapterDataWithSubjectId?chapterId=${chapterId}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(updateData),
      });
      const result = await response.json();
      if (!result.success) {
        setChapters(originalChapters);
        setError(result.message || "Update failed. Reverting changes.");
      }
    } catch (err) {
      setChapters(originalChapters);
      setError("An error occurred. Reverting changes.");
    }
  };

  const handleEditClick = (chapter) => {
    setChapterToEdit(chapter);
    setEditedChapterName(chapter.name);
    setIsEditDialogOpen(true);
  };

  const handleUpdateName = () => {
    if (chapterToEdit && editedChapterName) {
      updateChapter(chapterToEdit._id, { name: editedChapterName });
    }
    setIsEditDialogOpen(false);
    setChapterToEdit(null);
  };

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>
        Back to General Subjects
      </Button>

      <Typography variant="h4" gutterBottom>
        Chapters for <span style={{ color: "#3b82f6" }}>{generalSubjectName}</span>
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {loading ? (
        <Loader contained />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><b>Chapter Name</b></TableCell>
                <TableCell align="right"><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chapters.length > 0 ? (
                chapters.map((chapter) => (
                    <TableRow key={chapter._id}>
                      <TableCell>{chapter.name}</TableCell>
                      <TableCell align="right">
                          <Button 
                            variant="outlined" 
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditClick(chapter)}
                          >
                            Edit
                          </Button>
                      </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={3} align="center">
                        No chapters found. Add one to get started.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Fab
        variant="extended"
        color="primary"
        aria-label="add chapter"
        sx={{ position: "fixed", bottom: 40, right: 40 }}
        onClick={() => setIsAddDialogOpen(true)}
      >
        <AddIcon sx={{ mr: 1 }} />
        Add Chapter
      </Fab>

      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
        <DialogTitle>Add New Chapter to {generalSubjectName}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleAddChapter} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              margin="normal"
              required
              fullWidth
              label="Chapter Name"
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              sx={{ minWidth: "400px" }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddChapter}
            variant="contained"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Chapter"}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
        <DialogTitle>Edit Chapter Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Chapter Name"
            type="text"
            fullWidth
            variant="standard"
            value={editedChapterName}
            onChange={(e) => setEditedChapterName(e.target.value)}
            sx={{ minWidth: "400px" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateName}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GeneralChaptersView;