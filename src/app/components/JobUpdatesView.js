// src/app/components/JobUpdatesView.js
"use client";

import {
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  DialogContentText,
  Divider,
  Pagination,
  Stack,
  InputAdornment,
} from "@mui/material";
import { useState, useEffect, useCallback } from "react"; // Import useCallback
import AddIcon from "@mui/icons-material/Add";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import Loader from "./Loader";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LinkIcon from '@mui/icons-material/Link';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';

const JobUpdatesView = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminId, setAdminId] = useState(null);

  const [page, setPage] = useState(1);
  const jobsPerPage = 3;
  
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const initialFormState = {
    _id: null, title: "", organization: "", shortDescription: "", description: "",
    vacancy: "", qualification: "", category: "", applyLink: "", deadline: "",
  };
  const [formState, setFormState] = useState(initialFormState);

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
        const response = await fetch(`${baseURL}/api/coreJobData`, {
            method: "GET",
            headers: { "x-api-key": apiKey },
        });
        const result = await response.json();
        if (result.success) {
            setJobs(result.data);
        } else {
            setError(result.message);
        }
    } catch (err) {
        setError("Failed to fetch job updates.");
    } finally {
        setLoading(false);
    }
  }, [apiKey, baseURL]); // Add dependencies for useCallback

  useEffect(() => {
    const id = sessionStorage.getItem("adminId");
    if (id) setAdminId(id);
    fetchJobs();
  }, [fetchJobs]); // Add fetchJobs to the dependency array

  const handleCardClick = (job) => {
    setSelectedJob(job);
    setIsDetailsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditMode) {
      await handleUpdateJob();
    } else {
      await handleAddJob();
    }
  };

  const handleAddJob = async () => {
    if (!adminId) return setError("Admin ID not found.");

    setLoading(true);
    setError("");
    const jobPayload = { ...formState, createdBy: adminId };

    try {
        const jobResponse = await fetch(`${baseURL}/api/postJobData`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
            body: JSON.stringify(jobPayload)
        });
        const jobResult = await jobResponse.json();

        if (jobResult.success && jobResult.data) {
            const notificationPayload = {
                title: "New Job Opportunity!",
                message: formState.shortDescription,
                notificationType: "Job_update",
                jobId: jobResult.data._id
            };

            fetch(`${baseURL}/api/postNotificationData`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
                body: JSON.stringify(notificationPayload)
            }).catch(notificationError => {
                console.error("Failed to post notification:", notificationError);
            });

            setIsModalOpen(false);
            fetchJobs();
            
        } else {
            setError(jobResult.message || "Failed to add job.");
        }
    } catch(err) {
        setError("An error occurred while adding the job.");
    } finally {
        setLoading(false);
    }
  };
  
  const handleUpdateJob = async () => {
    if (!formState._id) return setError("Job ID not found for update.");
    setLoading(true);
    setError("");

    const { _id, ...payload } = formState;

    try {
        const response = await fetch(`${baseURL}/api/putJobData/${_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
            setIsModalOpen(false);
            fetchJobs();
        } else {
            setError(result.message || "Failed to update job.");
        }
    } catch (err) {
        setError("An error occurred while updating the job.");
    } finally {
        setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setFormState(initialFormState);
    setIsEditMode(false);
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditDialog = () => {
    const jobToEdit = selectedJob;
    setFormState({
        ...jobToEdit,
        deadline: new Date(jobToEdit.deadline).toISOString().split('T')[0]
    });
    setIsEditMode(true);
    setError('');
    setIsModalOpen(true);
    handleMenuClose();
  };

  const handleDelete = () => {
      setIsConfirmDeleteOpen(true);
      handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    if (!selectedJob) return;
    setError("");

    try {
        const response = await fetch(`${baseURL}/api/putJobData/${selectedJob._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
            body: JSON.stringify({ isActive: "false" })
        });
        const result = await response.json();
        if (result.success) {
            setIsConfirmDeleteOpen(false);
            fetchJobs(); 
        } else {
            setError(result.message || "Failed to delete job.");
            setIsConfirmDeleteOpen(false);
        }
    } catch (err) {
        setError("An error occurred while deleting the job.");
        setIsConfirmDeleteOpen(false);
    }
  };

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false);
    setSelectedJob(null);
  };

  const handleMenuOpen = (event, job) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const filteredJobs = jobs.filter(job =>
    (job.isActive !== false) && 
    (job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedJobs = filteredJobs.slice(
    (page - 1) * jobsPerPage,
    page * jobsPerPage
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Job Updates
      </Typography>

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ maxWidth: '400px', width: '100%' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by title, organization..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
        />
      </Box>

      {loading && !isDetailsModalOpen ? (
        <Loader contained />
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedJobs.map((job) => {
              const isExpired = new Date(job.deadline) < new Date();

              return (
                <Grid item xs={12} sm={6} md={4} key={job._id}>
                  <Card sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      height: '100%',
                      position: 'relative',
                      opacity: isExpired ? 0.7 : 1,
                      backgroundColor: isExpired ? 'action.disabledBackground' : 'background.paper'
                  }}>
                    {isExpired && (
                       <Chip 
                         label="Expired"
                         color="default"
                         size="small"
                         sx={{
                           position: 'absolute',
                           top: 16,
                           left: 16,
                           zIndex: 2,
                           backgroundColor: 'rgba(0,0,0,0.6)',
                           color: 'white'
                         }}
                       />
                    )}
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isExpired ? 'transparent' : 'action.hover' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessCenterIcon fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {job.organization}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, job)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {job.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {job.shortDescription}
                      </Typography>
                    </CardContent>
                    
                    <Divider />

                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        icon={<CalendarMonthIcon fontSize="small" />}
                        label={`Deadline: ${new Date(job.deadline).toLocaleDateString()}`}
                        color="error"
                        size="small"
                        variant="outlined"
                      />
                      <Button size="small" onClick={() => handleCardClick(job)} disabled={isExpired}>
                        View Details
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              )
            })}
            {filteredJobs.length === 0 && !loading && (
              <Grid item xs={12}>
                <Typography sx={{ textAlign: 'center', mt: 4 }}>No job updates found matching your search.</Typography>
              </Grid>
            )}
          </Grid>

          {filteredJobs.length > jobsPerPage && (
            <Stack alignItems="center" sx={{ mt: 3, width: '100%' }}>
              <Pagination
                count={Math.ceil(filteredJobs.length / jobsPerPage)}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Stack>
          )}
        </>
      )}

      <Fab
        variant="extended"
        color="primary"
        aria-label="add job"
        sx={{ position: "fixed", bottom: 40, right: 40 }}
        onClick={handleOpenAddDialog}
      >
        <AddIcon sx={{ mr: 1 }} />
        Add Job
      </Fab>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} disableRestoreFocus>
        <MenuItem onClick={handleOpenEditDialog}><EditIcon sx={{ mr: 1 }} fontSize="small" />Edit</MenuItem>
        <MenuItem onClick={handleDelete}><DeleteIcon sx={{ mr: 1 }} fontSize="small" />Delete</MenuItem>
      </Menu>

      <Dialog open={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to delete the job &quot;<b>{selectedJob?.title}</b>&quot;?</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfirmDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{isEditMode ? 'Edit Job Update' : 'Add Job Update'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField margin="dense" required fullWidth label="Job Title" name="title" value={formState.title} onChange={handleFormChange} />
            <TextField margin="dense" required fullWidth label="Organization" name="organization" value={formState.organization} onChange={handleFormChange} />
            <TextField margin="dense" required fullWidth label="Short Description (for card view)" name="shortDescription" value={formState.shortDescription} onChange={handleFormChange} />
            <TextField margin="dense" required fullWidth label="Full Description (for details view)" name="description" multiline rows={4} value={formState.description} onChange={handleFormChange}/>
            <TextField margin="dense" fullWidth label="Number of Vacancies" name="vacancy" type="number" value={formState.vacancy} onChange={handleFormChange}/>
            <TextField margin="dense" fullWidth label="Qualification Required" name="qualification" value={formState.qualification} onChange={handleFormChange}/>
            <TextField margin="dense" fullWidth label="Category (e.g., Government, IT)" name="category" value={formState.category} onChange={handleFormChange}/>
            <TextField margin="dense" required fullWidth label="Apply Link" name="applyLink" type="url" value={formState.applyLink} onChange={handleFormChange}/>
            <TextField margin="dense" required fullWidth label="Application Deadline" name="deadline" type="date" InputLabelProps={{ shrink: true }} value={formState.deadline} onChange={handleFormChange} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Job')}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={isDetailsModalOpen} onClose={handleCloseDetails} fullWidth maxWidth="md">
        {selectedJob && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={handleCloseDetails} sx={{ mr: 1 }}>
                    <ArrowBackIcon />
                </IconButton>
                {selectedJob.title}
            </DialogTitle>
            <DialogContent dividers>
                <Typography variant="subtitle1" color="primary.main" gutterBottom>{selectedJob.organization}</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>{selectedJob.description}</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography><strong>Qualification:</strong> {selectedJob.qualification}</Typography>
                <Typography><strong>Vacancies:</strong> {selectedJob.vacancy}</Typography>
                <Typography><strong>Category:</strong> {selectedJob.category}</Typography>
                <Typography><strong>Posted On:</strong> {new Date(selectedJob.postedAt).toLocaleDateString()}</Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button variant="contained" startIcon={<LinkIcon />} href={selectedJob.applyLink} target="_blank" rel="noopener noreferrer">
                    Apply Now
                </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default JobUpdatesView;