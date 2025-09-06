// src/app/components/SubscriptionsView.js
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
  Paper,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Autocomplete,
  Stepper,
  Step,
  StepLabel,
  Switch,
  FormControlLabel,
  InputAdornment,
  Divider,
  IconButton,
  Pagination,
  Stack,
  Menu, // <-- Import Menu
  DialogContentText,
} from "@mui/material";
import { useState, useEffect, useMemo, useCallback } from "react"; // Import useCallback
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert'; // <-- Import Menu Icon
import Loader from "./Loader";
import SubscriptionsIcon from "@mui/icons-material/Subscriptions";
import SchoolIcon from "@mui/icons-material/School";

const steps = ['Basic Information', 'Pricing', 'Review & Submit'];

const SubscriptionsView = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminId, setAdminId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [page, setPage] = useState(1);
  const subscriptionsPerPage = 3;
  
  const initialFormState = {
    _id: null,
    name: "",
    description: "",
    classId: "",
    isJobUpdate: false,
    pricingPlans: [{ 
        price: "", 
        discount: "0", 
        gstPercent: "18", 
        durationMonths: "", 
        type: "monthly" 
    }]
  };
  const [formState, setFormState] = useState(initialFormState);
  
  // State for menu and confirmation dialog
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);


  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${baseURL}/api/coreSubscriptionsData`, {
        method: "GET",
        headers: { "x-api-key": apiKey },
      });
      const result = await response.json();
      if (result.success) {
        setSubscriptions(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to fetch subscriptions.");
    } finally {
      setLoading(false);
    }
  }, [apiKey, baseURL]); // Add dependencies for useCallback

  const fetchClasses = useCallback(async () => {
    try {
      const response = await fetch(`${baseURL}/api/coreClassData`, {
        method: "GET",
        headers: { "x-api-key": apiKey },
      });
      const result = await response.json();
      if (result.success) {
        setClasses(result.data.filter((c) => c.isActive));
      }
    } catch (err) {
      console.error("Failed to fetch classes for dropdown.");
    }
  }, [apiKey, baseURL]); // Add dependencies for useCallback

  useEffect(() => {
    const id = sessionStorage.getItem("adminId");
    if (id) setAdminId(id);
    fetchSubscriptions();
    fetchClasses();
  }, [fetchSubscriptions, fetchClasses]); // Add dependencies

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormState(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const handleAutocompleteChange = (newValue) => {
    setFormState(prev => ({ ...prev, classId: newValue ? newValue._id : "" }));
  };

  const handlePlanChange = (index, event) => {
    const newPricingPlans = [...formState.pricingPlans];
    newPricingPlans[index][event.target.name] = event.target.value;
    setFormState(prev => ({ ...prev, pricingPlans: newPricingPlans }));
  };

  const addPricingPlan = () => {
    setFormState(prev => ({
        ...prev,
        pricingPlans: [...prev.pricingPlans, { price: '', discount: '0', gstPercent: '18', durationMonths: '', type: 'monthly' }]
    }));
  };

  const removePricingPlan = (index) => {
    const newPricingPlans = [...formState.pricingPlans];
    if (newPricingPlans.length > 1) {
        newPricingPlans.splice(index, 1);
        setFormState(prev => ({...prev, pricingPlans: newPricingPlans}));
    }
  };

  const handleSubmit = (e) => {
      e.preventDefault();
      if (isEditMode) {
          handleUpdateSubscription();
      } else {
          handleAddSubscription();
      }
  }

  const handleAddSubscription = async () => {
    if (!adminId) return setError("Admin ID not found.");
    if (!formState.classId) return setError("Please select a class.");
    
    setLoading(true);

    const payload = {
      name: formState.name,
      description: formState.description,
      isJobUpdate: formState.isJobUpdate,
      createdBy: adminId,
      classId: formState.classId,
      pricingPlans: formState.pricingPlans.map(p => {
          const { total } = calculatePricing(p);
          return {
              price: Number(p.price),
              discount: Number(p.discount),
              gstPercent: Number(p.gstPercent),
              durationMonths: Number(p.durationMonths),
              type: p.type,
              totalAmount: Number(total),
          }
      }),
    };

    try {
      const response = await fetch(`${baseURL}/api/postSubscriptionData`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) {
        setIsModalOpen(false);
        fetchSubscriptions();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An error occurred while adding the subscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (updateData) => {
    const subToUpdate = updateData ? selectedSub : formState;
    const payload = updateData || {
      name: formState.name,
      description: formState.description,
      isJobUpdate: formState.isJobUpdate,
      pricingPlans: formState.pricingPlans.map(p => {
        const { total } = calculatePricing(p);
        return {
          price: Number(p.price),
          discount: Number(p.discount),
          gstPercent: Number(p.gstPercent),
          durationMonths: Number(p.durationMonths),
          type: p.type,
          totalAmount: Number(total),
        };
      }),
    };
    
    // Optimistic UI update
    const originalSubscriptions = [...subscriptions];
    const updatedSubscriptions = subscriptions.map(s => s._id === subToUpdate._id ? {...s, ...payload} : s);
    setSubscriptions(updatedSubscriptions);
    setIsModalOpen(false);

    try {
      const response = await fetch(`${baseURL}/api/putSubscriptionData?subscriptionId=${subToUpdate._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!result.success) {
        setError(result.message);
        setSubscriptions(originalSubscriptions); // Revert on failure
      } else {
        fetchSubscriptions(); // Re-fetch for consistency
      }
    } catch (err) {
      setError("An error occurred while updating the subscription.");
      setSubscriptions(originalSubscriptions); // Revert on failure
    }
  };
  
  const handleDelete = () => {
    setIsConfirmDeleteOpen(true);
    handleMenuClose();
  };
  
  const handleConfirmDelete = () => {
    if (selectedSub) {
      handleUpdateSubscription({ isActive: false });
    }
    setIsConfirmDeleteOpen(false);
  };
  
  const selectedClassValue = classes.find(c => c._id === formState.classId) || null;
  
  const calculatePricing = (plan) => {
    const base = Number(plan.price) || 0;
    const discountAmount = base * (Number(plan.discount) / 100);
    const discountedPrice = base - discountAmount;
    const gstAmount = discountedPrice * (Number(plan.gstPercent) / 100);
    const total = discountedPrice + gstAmount;
    return {
      base: base.toFixed(2),
      discount: discountAmount.toFixed(2),
      gst: gstAmount.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const handleNext = () => setActiveStep((prevActiveStep) => prevActiveStep + 1);
  const handleBack = () => setActiveStep((prevActiveStep) => prevActiveStep - 1);
  
  const handleOpenAddDialog = () => {
    setFormState(initialFormState);
    setIsEditMode(false);
    setActiveStep(0);
    setError('');
    setIsModalOpen(true);
  }

  const handleOpenEditDialog = () => {
    setFormState({
        _id: selectedSub._id,
        name: selectedSub.name,
        description: selectedSub.description,
        classId: selectedSub.classId?._id || "",
        isJobUpdate: selectedSub.isJobUpdate || false,
        pricingPlans: selectedSub.pricingPlans.map(p => ({...p}))
    });
    setIsEditMode(true);
    setActiveStep(0);
    setError('');
    setIsModalOpen(true);
    handleMenuClose();
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  const handleMenuOpen = (event, sub) => {
    setAnchorEl(event.currentTarget);
    setSelectedSub(sub);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // Keep selectedSub for confirmation dialog
  };

  // Filter for active subscriptions
  const activeSubscriptions = subscriptions.filter(sub => sub.isActive);
  
  const paginatedSubscriptions = activeSubscriptions.slice(
    (page - 1) * subscriptionsPerPage,
    page * subscriptionsPerPage
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
            <Autocomplete
              options={classes}
              getOptionLabel={(option) => option.name}
              value={selectedClassValue}
              onChange={(event, newValue) => handleAutocompleteChange(newValue)}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              renderInput={(params) => <TextField {...params} label="Select Class" required />}
            />
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Subscription Details</Typography>
            <TextField margin="dense" required fullWidth label="Subscription Name" name="name" value={formState.name} onChange={handleFormChange} />
            <TextField margin="dense" fullWidth label="Description" name="description" multiline rows={3} value={formState.description} onChange={handleFormChange}/>
            <FormControlLabel control={<Switch name="isJobUpdate" checked={formState.isJobUpdate} onChange={handleFormChange} />} label="Enable Job Updates" sx={{ mt: 1 }} />
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Pricing</Typography>
            {formState.pricingPlans.map((plan, index) => {
                 const summary = calculatePricing(plan);
                 return (
                    <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2, position: 'relative' }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>Pricing Details #{index + 1}</Typography>
                         <IconButton size="small" onClick={() => removePricingPlan(index)} sx={{ position: 'absolute', top: 8, right: 8 }} disabled={formState.pricingPlans.length <= 1}>
                            <DeleteIcon />
                        </IconButton>
                        <TextField fullWidth margin="dense" required label="Duration (Months)" name="durationMonths" type="number" value={plan.durationMonths} onChange={e => handlePlanChange(index, e)} />
                        <FormControl fullWidth margin="dense" required>
                            <InputLabel>Type</InputLabel>
                            <Select name="type" value={plan.type} label="Type" onChange={e => handlePlanChange(index, e)}>
                                <MenuItem value="monthly">Monthly</MenuItem>
                                <MenuItem value="quarterly">Quarterly</MenuItem>
                                <MenuItem value="yearly">Yearly</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField fullWidth margin="dense" required label="Base Amount (₹)" name="price" type="number" value={plan.price} onChange={e => handlePlanChange(index, e)} />
                        <TextField fullWidth margin="dense" label="Discount (%)" name="discount" type="number" value={plan.discount} onChange={e => handlePlanChange(index, e)} />
                        <TextField fullWidth margin="dense" label="GST (%)" name="gstPercent" type="number" value={plan.gstPercent} onChange={e => handlePlanChange(index, e)} />
                        
                        <Box sx={{ p: 2, mt: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Pricing Summary</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Base Amount:</Typography><Typography variant="body2">₹{summary.base}</Typography></Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Discount:</Typography><Typography variant="body2">- ₹{summary.discount}</Typography></Box>
                             <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Subtotal:</Typography><Typography variant="body2">₹{(summary.base - summary.discount).toFixed(2)}</Typography></Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">GST ({plan.gstPercent}%):</Typography><Typography variant="body2">+ ₹{summary.gst}</Typography></Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontWeight: 'bold' }}>Total Amount:</Typography><Typography sx={{ fontWeight: 'bold' }}>₹{summary.total}</Typography></Box>
                        </Box>
                    </Paper>
                )
            })}
            <Button fullWidth onClick={addPricingPlan} sx={{ mt: 1 }}>Add Another Pricing Plan</Button>
          </Box>
        );
      case 2:
        return (
             <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Review & Submit</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Subscription Details:</Typography>
                    <Typography variant="body2"><strong>Name:</strong> {formState.name}</Typography>
                    <Typography variant="body2"><strong>Class:</strong> {selectedClassValue?.name}</Typography>
                    <Typography variant="body2"><strong>Job Updates:</strong> {formState.isJobUpdate ? 'Enabled' : 'Disabled'}</Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Pricing Plans:</Typography>
                    {formState.pricingPlans.map((plan, index) => {
                        const summary = calculatePricing(plan);
                        return (
                            <Box key={index} sx={{ mb: 1 }}>
                                <Typography variant="body2"><strong>Plan #{index+1}:</strong> {plan.durationMonths} month(s) at <strong>₹{summary.total}</strong></Typography>
                            </Box>
                        )
                    })}
                </Paper>
            </Box>
        );
      default: return 'Unknown step';
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Subscription Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Loader contained />
      ) : (
        <>
            <Grid container spacing={3}>
            {paginatedSubscriptions.map((sub) => (
                <Grid item xs={12} sm={6} md={4} key={sub._id}>
                <Card sx={{ height: "100%", display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ p: 3, flexGrow: 1, position: 'relative' }}>
                    <IconButton size="small" sx={{ position: 'absolute', top: 16, right: 16 }} onClick={(e) => handleMenuOpen(e, sub)}>
                        <MoreVertIcon />
                    </IconButton>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        <Box sx={{ p: 1.5, borderRadius: "50%", display: "flex", backgroundColor: "secondary.lighter" }}>
                        <SubscriptionsIcon color="secondary" />
                        </Box>
                        <Typography variant="h6">{sub.name}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {sub.description}
                    </Typography>
                    {sub.classId && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <SchoolIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                Associated Class: <strong>{sub.classId.name}</strong>
                            </Typography>
                        </Box>
                    )}
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                        Pricing Plans:
                        </Typography>
                        {sub.pricingPlans.map((plan, index) => {
                        const totalAmount = plan.totalAmount ?? ((plan.price - (plan.price * (plan.discount || 0) / 100)) * (1 + (plan.gstPercent || 0) / 100));
                        const hasDiscount = plan.discount && plan.discount > 0;
                        const originalTotal = plan.price * (1 + (plan.gstPercent || 0) / 100);
                        return (
                            <Box key={index} sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                {plan.durationMonths} Month(s)
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                {hasDiscount && (
                                <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                    ₹{originalTotal.toFixed(2)}
                                </Typography>
                                )}
                                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                ₹{totalAmount.toFixed(2)}
                                </Typography>
                            </Box>
                            </Box>
                        )
                        })}
                    </Paper>
                    </CardContent>
                </Card>
                </Grid>
            ))}
            </Grid>

             {activeSubscriptions.length > subscriptionsPerPage && (
                <Stack alignItems="center" sx={{ mt: 3, width: '100%' }}>
                <Pagination
                    count={Math.ceil(activeSubscriptions.length / subscriptionsPerPage)}
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
        aria-label="add subscription"
        sx={{ position: "fixed", bottom: 40, right: 40 }}
        onClick={handleOpenAddDialog}
      >
        <AddIcon sx={{ mr: 1 }} />
        Add Subscription
      </Fab>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleOpenEditDialog}><EditIcon sx={{ mr: 1 }} fontSize="small" />Edit</MenuItem>
        <MenuItem onClick={handleDelete}><DeleteIcon sx={{ mr: 1 }} fontSize="small" />Delete</MenuItem>
      </Menu>

      <Dialog open={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
            <DialogContentText>
                Are you sure you want to delete the subscription &quot;<b>{selectedSub?.name}</b>&quot;? This action cannot be undone.
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setIsConfirmDeleteOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
             <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                </Step>
                ))}
            </Stepper>
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: '400px', pt: 3 }}>
            {getStepContent(activeStep)}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Box sx={{ flex: '1 1 auto' }} />
          <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
          {activeStep === steps.length - 1 ? (
             <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Subscription')}
             </Button>
          ) : (
             <Button onClick={handleNext} variant="contained">Next</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionsView;