// src/app/components/GeneralSubjectView.js
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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Checkbox,
} from "@mui/material";
import { useState, useEffect, useCallback } from "react"; // Import useCallback
import AddIcon from "@mui/icons-material/Add";
import Loader from "./Loader";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;


const GeneralSubjectView = ({ onSubjectSelect }) => { // Added onSubjectSelect prop
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [adminId, setAdminId] = useState(null);

  const initialFormState = {
    name: "",
    visibility: "all",
    allowedClassIds: [],
  };
  const [formState, setFormState] = useState(initialFormState);

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

  const fetchGeneralSubjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${baseURL}/api/coreGeneralSubjectData`, {
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
      setError("Failed to fetch general subjects.");
    } finally {
      setLoading(false);
    }
  }, [apiKey, baseURL]); // Add dependencies for useCallback

  const fetchClasses = useCallback(async () => {
    try {
      const response = await fetch(`${baseURL}/api/coreClassData`, {
        headers: { "x-api-key": apiKey },
      });
      const result = await response.json();
      if (result.success) {
        setClasses(result.data.filter(c => c.isActive));
      }
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    }
  }, [apiKey, baseURL]); // Add dependencies for useCallback

  useEffect(() => {
    const id = sessionStorage.getItem("adminId");
    if (id) setAdminId(id);
    fetchGeneralSubjects();
    fetchClasses();
  }, [fetchGeneralSubjects, fetchClasses]); // Add dependencies

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!adminId) {
      setError("Admin ID not found. Please log in again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...formState,
        allowedClassIds: formState.visibility === 'whitelist' ? formState.allowedClassIds.map(c => c._id) : [],
        createdBy: adminId,
      };
      const response = await fetch(`${baseURL}/api/postGeneralSubjectData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) {
        setIsAddDialogOpen(false);
        setFormState(initialFormState);
        fetchGeneralSubjects();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An error occurred while adding the subject.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        General Subjects
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Loader contained />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><b>Subject Name</b></TableCell>
                <TableCell><b>Visibility</b></TableCell>
                <TableCell><b>Allowed Classes</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow 
                  key={subject._id} 
                  hover 
                  onClick={() => onSubjectSelect({ id: subject._id, name: subject.name })}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{subject.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={subject.visibility}
                      size="small"
                      color={subject.visibility === 'all' ? 'primary' : 'secondary'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {subject.visibility === 'whitelist' && subject.allowedClassIds.length > 0
                      ? subject.allowedClassIds.map(c => c.name).join(', ')
                      : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Fab
        variant="extended"
        color="primary"
        aria-label="add general subject"
        sx={{ position: "fixed", bottom: 40, right: 40 }}
        onClick={() => setIsAddDialogOpen(true)}
      >
        <AddIcon sx={{ mr: 1 }} />
        Add General Subject
      </Fab>

      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New General Subject</DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleAddSubject} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              margin="normal"
              required
              fullWidth
              label="Subject Name"
              name="name"
              value={formState.name}
              onChange={handleFormChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Visibility</InputLabel>
              <Select
                name="visibility"
                value={formState.visibility}
                label="Visibility"
                onChange={handleFormChange}
              >
                <MenuItem value="all">All Classes</MenuItem>
                <MenuItem value="whitelist">Specific Classes</MenuItem>
              </Select>
            </FormControl>

            {formState.visibility === 'whitelist' && (
              <Autocomplete
                multiple
                options={classes}
                disableCloseOnSelect
                getOptionLabel={(option) => option.name}
                value={formState.allowedClassIds}
                onChange={(event, newValue) => {
                  setFormState(prev => ({...prev, allowedClassIds: newValue}));
                }}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox
                      icon={icon}
                      checkedIcon={checkedIcon}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {option.name}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Allowed Classes" placeholder="Select classes" />
                )}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddSubject} variant="contained" disabled={loading}>
            {loading ? "Adding..." : "Add Subject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GeneralSubjectView;