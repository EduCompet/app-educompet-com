// app/components/Subjects.js
"use client";

import {
  Typography,
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Fab,
  Pagination,
  Stack,
} from "@mui/material";
import { useState, useEffect, useCallback } from "react"; // Import useCallback
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";

const SubjectView = ({ classId, className, onBack, onSubjectSelect }) => { // <-- Add onSubjectSelect prop
  const [subjectName, setSubjectName] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("active");
  const [page, setPage] = useState(1);
  const subjectsPerPage = 5;

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedSubjectName, setEditedSubjectName] = useState("");
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [subjectToAction, setSubjectToAction] = useState(null);

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const createdBy = "60d0fe4f5311236168a109ca";

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseURL}/api/coreSubjectsData`, {
        method: "GET",
        headers: { "x-api-key": apiKey },
      });
      const result = await response.json();
      if (result.success) {
        setSubjects(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to fetch subjects.");
    } finally {
      setLoading(false);
    }
  }, [apiKey, baseURL]); // Add dependencies for useCallback

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]); // Add fetchSubjects to the dependency array

  const updateSubject = async (subjectId, classId, updateData) => {
    const originalSubjects = [...subjects];
    const updatedSubjects = subjects.map((s) =>
      s._id === subjectId ? { ...s, ...updateData } : s
    );
    setSubjects(updatedSubjects);
    setError("");

    try {
      const url = `${baseURL}/api/putSubjectDataWithClassId?subjectId=${subjectId}&classId=${classId}`;
      const response = await fetch(
        url,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify(updateData),
        }
      );
      const result = await response.json();
      if (!result.success) {
        setSubjects(originalSubjects);
        setError(result.message || "Update failed. Reverting changes.");
      }
    } catch (err) {
      setSubjects(originalSubjects);
      setError("An error occurred. Reverting changes.");
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${baseURL}/api/postSubjectData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          name: subjectName,
          classId: classId,
          createdBy: createdBy,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setSubjectName("");
        setIsAddDialogOpen(false);
        fetchSubjects();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An error occurred while adding the subject.");
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, subject) => {
    event.stopPropagation(); // <-- Prevent row click when opening menu
    setAnchorEl(event.currentTarget);
    setSelectedSubject(subject);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSubject(null);
  };

  const handleEditClick = () => {
    setSubjectToAction(selectedSubject);
    setEditedSubjectName(selectedSubject.name);
    setIsEditDialogOpen(true);
    handleMenuClose();
  };

  const handleUpdateName = () => {
    if (subjectToAction && editedSubjectName) {
      updateSubject(subjectToAction._id, subjectToAction.classId._id, { name: editedSubjectName });
    }
    setIsEditDialogOpen(false);
    setSubjectToAction(null);
  };

  const handleToggleActiveStatus = () => {
    setSubjectToAction(selectedSubject);
    setIsConfirmDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmToggle = () => {
    if (subjectToAction) {
      updateSubject(subjectToAction._id, subjectToAction.classId._id, {
        isActive: !subjectToAction.isActive,
      });
    }
    setIsConfirmDialogOpen(false);
    setSubjectToAction(null);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const subjectsForClass = subjects.filter(
    (s) =>
      s.classId._id === classId &&
      (viewMode === "active" ? s.isActive : !s.isActive)
  );
  
  const paginatedSubjects = subjectsForClass.slice(
    (page - 1) * subjectsPerPage,
    page * subjectsPerPage
  );

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>
        Back to Classes
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Subjects for <span style={{ color: "#3b82f6" }}>{className}</span>
        </Typography>
        <Button
            variant="outlined"
            onClick={() => { setViewMode(viewMode === 'active' ? 'inactive' : 'active'); setPage(1); }}
            startIcon={viewMode === 'active' ? <VisibilityOffIcon /> : <VisibilityIcon />}
        >
            View {viewMode === 'active' ? 'Inactive' : 'Active'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Typography variant="h6" gutterBottom>
        {viewMode === 'active' ? 'Active Subjects' : 'Inactive Subjects'}
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSubjects.map((s) => (
              <TableRow 
                key={s._id}
                hover
                onClick={() => onSubjectSelect({ id: s._id, name: s.name })}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{s.name}</TableCell>
                <TableCell>
                  <Typography sx={{ color: s.isActive ? 'success.main' : 'error.main', fontWeight: 500 }}>
                    {s.isActive ? "Active" : "Inactive"}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={(e) => handleMenuOpen(e, s)}>
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {subjectsForClass.length > subjectsPerPage && (
        <Stack alignItems="center" sx={{ mt: 3, width: '100%' }}>
          <Pagination
            count={Math.ceil(subjectsForClass.length / subjectsPerPage)}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Stack>
      )}

      {viewMode === 'active' && (
        <Fab
          variant="extended"
          color="primary"
          aria-label="add subject"
          sx={{
            position: "fixed",
            bottom: 40,
            right: 40,
          }}
          onClick={() => setIsAddDialogOpen(true)}
        >
          <AddIcon sx={{ mr: 1 }} />
          Add Subject
        </Fab>
      )}

      {/* --- Dialogs --- */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        disableRestoreFocus
      >
        <MenuItem onClick={handleEditClick}>Edit</MenuItem>
        <MenuItem onClick={handleToggleActiveStatus}>
          {selectedSubject?.isActive ? "Make Inactive" : "Make Active"}
        </MenuItem>
      </Menu>

      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
        <DialogTitle>Edit Subject Name</DialogTitle>
        <DialogContent><TextField autoFocus margin="dense" label="Subject Name" type="text" fullWidth variant="standard" value={editedSubjectName} onChange={(e) => setEditedSubjectName(e.target.value)} sx={{ minWidth: "400px" }}/></DialogContent>
        <DialogActions>
            <Button onClick={() => { setIsEditDialogOpen(false); setSubjectToAction(null); }}>Cancel</Button>
            <Button onClick={handleUpdateName}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isConfirmDialogOpen} onClose={() => setIsConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to make this subject <b>{subjectToAction?.isActive ? "inactive" : "active"}</b>?</DialogContentText></DialogContent>
        <DialogActions>
            <Button onClick={() => { setIsConfirmDialogOpen(false); setSubjectToAction(null); }}>Cancel</Button>
            <Button onClick={handleConfirmToggle} color="primary" autoFocus>Confirm</Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
        <DialogTitle>Add New Subject to {className}</DialogTitle>
        <DialogContent><Box component="form" onSubmit={handleAddSubject} sx={{ mt: 1 }}><TextField autoFocus margin="normal" required fullWidth label="Subject Name" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} sx={{ minWidth: "400px" }}/></Box></DialogContent>
        <DialogActions><Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button><Button onClick={handleAddSubject} variant="contained" disabled={loading}>{loading ? "Adding..." : "Add Subject"}</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubjectView;