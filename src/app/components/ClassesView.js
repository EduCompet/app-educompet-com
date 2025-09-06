// src/app/components/ClassesView.js
"use client";
import {
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
  Pagination,
  Stack,
  Menu,
  MenuItem,
  Alert,
} from "@mui/material";
import { useState, useEffect, useCallback } from "react"; // Import useCallback
import Loader from "./Loader";

// Import necessary icons
import SchoolIcon from "@mui/icons-material/School";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function ClassesView({
  mode = "active",
  onClassSelect,
  onToggleView,
}) {
  const [className, setClassName] = useState("");
  const [classes, setClasses]                   = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminId, setAdminId] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState(null);
  const [editedClassName, setEditedClassName] = useState("");

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [classToToggle, setClassToToggle] = useState(null);

  const classesPerPage = 3;
  const isInactiveView = mode === "inactive";

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

  const fetchClassesAndSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, subjectRes] = await Promise.all([
        fetch(`${baseURL}/api/coreClassData`, { headers: { "x-api-key": apiKey } }),
        fetch(`${baseURL}/api/coreSubjectsData`, { headers: { "x-api-key": apiKey } })
      ]);

      const classResult = await classRes.json();
      const subjectResult = await subjectRes.json();

      if (classResult.success) {
        setClasses(classResult.data);
      } else {
        setError(classResult.message);
      }

      if (subjectResult.success) {
        setSubjects(subjectResult.data);
      } else {
        console.error("Could not fetch subjects:", subjectResult.message);
      }
    } catch (err) {
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }, [apiKey, baseURL]); // Add dependencies for useCallback

  useEffect(() => {
    const storedAdminId = sessionStorage.getItem("adminId");
    if (storedAdminId) {
      setAdminId(storedAdminId);
    } else {
      setError("Admin not logged in. Please login again.");
    }
    fetchClassesAndSubjects();
  }, [fetchClassesAndSubjects]); // Add fetchClassesAndSubjects to the dependency array


  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!adminId) {
      setError("Cannot add class without Admin ID. Please login again.");
      return;
    }
    setLoading(true);
    try {
      await fetch(`${baseURL}/api/postClassData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ name: className, createdBy: adminId }),
      });
      setClassName("");
      setOpenAddDialog(false);
      fetchClassesAndSubjects();
    } catch (err) {
      setError("An error occurred while adding the class.");
    } finally {
      setLoading(false);
    }
  };

  const updateClass = async (classId, updateData) => {
    const originalClasses = [...classes];
    const updatedClasses = classes.map((c) => {
      if (c._id === classId) {
        return { ...c, ...updateData };
      }
      return c;
    });
    setClasses(updatedClasses);
    setError("");

    try {
      const response = await fetch(`${baseURL}/api/putClassData/${classId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(updateData),
      });
      const result = await response.json();
      if (!result.success) {
        setClasses(originalClasses);
        setError(result.message || "Update failed. Reverting changes.");
      }
    } catch (err) {
      setClasses(originalClasses);
      setError("An error occurred. Reverting changes.");
    }
  };

  const handleMenuOpen = (event, classItem) => {
    setAnchorEl(event.currentTarget);
    setSelectedClass(classItem);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClass(null);
  };

  const handleEditClick = () => {
    setClassToEdit(selectedClass);
    setEditedClassName(selectedClass.name);
    setIsEditDialogOpen(true);
    handleMenuClose();
  };

  const handleUpdateName = () => {
    if (classToEdit && editedClassName) {
      updateClass(classToEdit._id, { name: editedClassName });
    }
    setIsEditDialogOpen(false);
  };

  const handleToggleActiveStatus = () => {
    setClassToToggle(selectedClass);
    setIsConfirmDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmToggle = () => {
    if (classToToggle) {
      updateClass(classToToggle._id, { isActive: !classToToggle.isActive });
    }
    setIsConfirmDialogOpen(false);
    setClassToToggle(null);
  };

  const handlePageChange = (event, value) => setPage(value);
  const handleCardClick = (classId, className) => {
    if (onClassSelect) onClassSelect({ id: classId, name: className });
  };

  const filteredClasses = classes.filter(
    (c) =>
      (isInactiveView ? !c.isActive : c.isActive) &&
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedClasses = filteredClasses.slice(
    (page - 1) * classesPerPage,
    page * classesPerPage
  );
  
  // Updated to count only active subjects
  const getSubjectCount = (classId) => {
    return subjects.filter(subject => subject.classId._id === classId && subject.isActive).length;
  };

  return (
    <Box sx={{ position: "relative", minHeight: "80vh", pb: 8 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {isInactiveView ? "Inactive Classes" : "Class Management"}
        </Typography>
        <Button
          variant="outlined"
          onClick={onToggleView}
          startIcon={isInactiveView ? <VisibilityIcon /> : <VisibilityOffIcon />}
        >
          {isInactiveView ? "View Active Classes" : "View Inactive Classes"}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search classes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
        />
      </Paper>

      {loading ? (
        <Loader contained />
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedClasses.map((c) => (
              <Grid item xs={12} key={c._id}>
                <Card
                  sx={{
                    position: "relative",
                    borderRadius: 4,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: isInactiveView ? "none" : "translateY(-4px)",
                    },
                  }}
                >
                  <IconButton
                    aria-label="settings"
                    size="small"
                    onClick={(e) => handleMenuOpen(e, c)}
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 12,
                      zIndex: 1,
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                  <CardActionArea
                    onClick={() => handleCardClick(c._id, c.name)}
                    disabled={isInactiveView}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 4 }}>
                        <Box sx={{ backgroundColor: '#e0e7ff', borderRadius: '50%', p: 1.5, display: 'flex' }}>
                          <SchoolIcon sx={{ color: '#4f46e5' }} />
                        </Box>
                        <div>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                          <Typography variant="body2" color="text.secondary">video lessons, short notes</Typography>
                        </div>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
                        <div>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>{getSubjectCount(c._id)}</Typography>
                          <Typography variant="body2" color="text.secondary">Subjects</Typography>
                        </div>
                        <div>
                          <Typography sx={{ fontWeight: 600, color: c.isActive ? '#10b981' : '#f43f5e' }}>{c.isActive ? 'Active' : 'Inactive'}</Typography>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                        </div>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
             {filteredClasses.length > classesPerPage && (
            <Stack
              spacing={2}
              sx={{
                py: 2,
                width: '100%',
                alignItems: 'center',
                mt: 2,
              }}
            >
              <Pagination
                count={Math.ceil(filteredClasses.length / classesPerPage)}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Stack>
          )}
        </>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        disableRestoreFocus
      >
        <MenuItem onClick={handleEditClick}>Edit</MenuItem>
        <MenuItem onClick={handleToggleActiveStatus}>
          {selectedClass?.isActive ? "Make Inactive" : "Make Active"}
        </MenuItem>
      </Menu>

      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
      >
        <DialogTitle>Edit Class Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Class Name"
            type="text"
            fullWidth
            variant="standard"
            value={editedClassName}
            onChange={(e) => setEditedClassName(e.target.value)}
            sx={{ minWidth: "400px" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateName}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to make this class{" "}
            <b>{classToToggle?.isActive ? "inactive" : "active"}</b>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmToggle} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {!isInactiveView && (
        <Fab
          variant="extended"
          color="primary"
          aria-label="add class"
          sx={{
            position: "fixed",
            bottom: 40,
            right: 40,
            textTransform: "none",
            fontWeight: 600,
          }}
          onClick={() => setOpenAddDialog(true)}
        >
          <AddIcon sx={{ mr: 1 }} />
          Add Class
        </Fab>
      )}

      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Add New Class</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleAddClass} sx={{ mt: 1 }}>
            {error && <Typography color="error" align="center" sx={{ mb: 2 }}>{error}</Typography>}
            <TextField margin="normal" required fullWidth id="className" label="Class Name" name="className" autoFocus value={className} onChange={(e) => setClassName(e.target.value)} sx={{ minWidth: "400px" }}/>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddClass} variant="contained" disabled={loading}>{loading ? "Adding..." : "Add Class"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}