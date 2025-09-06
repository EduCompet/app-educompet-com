"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Pagination,
  Stack,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Loader from "./Loader";

// A new component to handle client-side rendering for the age
const ClientOnlyAge = ({ dob }) => {
  const [age, setAge] = useState("N/A");

  useEffect(() => {
    if (!dob) return;
    const birthDate = new Date(dob);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    setAge(calculatedAge);
  }, [dob]);

  return <>{age}</>;
};


const StudentsView = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [details, setDetails] = useState({ subscriptions: [], transactions: [] });
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const studentsPerPage = 10;

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${baseURL}/api/getUsersData`, {
        headers: { "x-api-key": apiKey },
      });
      const result = await response.json();
      if (result.success) {
        setStudents(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to fetch students.");
    } finally {
      setLoading(false);
    }
  }, [apiKey, baseURL]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleViewDetails = async (student) => {
    setSelectedStudent(student);
    setDetailsLoading(true);
    try {
      const [subRes, trxRes] = await Promise.all([
        fetch(`${baseURL}/api/getUserSubscriptionDataWithUserId?userId=${student._id}`, {
          headers: { "x-api-key": apiKey },
        }),
        fetch(`${baseURL}/api/getTrxDataWithUserId?userId=${student._id}`, {
          headers: { "x-api-key": apiKey },
        }),
      ]);

      const subResult = await subRes.json();
      const trxResult = await trxRes.json();

      setDetails({
        subscriptions: subResult.success ? subResult.data.subscriptions : [],
        transactions: trxResult.success ? trxResult.data : [],
      });
    } catch (err) {
      setError("Failed to fetch details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedStudent(null);
    setDetails({ subscriptions: [], transactions: [] });
  };

  const handleSearchChange = (event) => {
    setPage(1);
    setSearchTerm(event.target.value);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const getStatusChip = (status) => {
    const styles = {
      success: {
        color: '#389e0d',
        backgroundColor: '#f6ffed',
        borderColor: '#b7eb8f',
      },
      error: {
        color: '#cf1322',
        backgroundColor: '#fff1f0',
        borderColor: '#ffa39e',
      },
      warning: {
        color: '#d46b08',
        backgroundColor: '#fffbe6',
        borderColor: '#ffe58f',
      },
      default: {
        color: '#595959',
        backgroundColor: '#fafafa',
        borderColor: '#d9d9d9',
      },
    };

    let style;
    switch (status) {
      case "active":
      case "success":
        style = styles.success;
        break;
      case "expired":
      case "failed":
        style = styles.error;
        break;
      case "pending":
        style = styles.warning;
        break;
      default:
        style = styles.default;
    }
    return <Chip label={status} size="small" sx={{ ...style, borderWidth: 1, borderStyle: 'solid' }} />;
  };

  const filteredStudents = students.filter(
    (student) =>
      (student.fullName && student.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedStudents = filteredStudents.slice(
    (page - 1) * studentsPerPage,
    page * studentsPerPage
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Students
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ maxWidth: 500 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by name, email, or student ID..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />
      </Box>

      {loading ? (
        <Loader contained />
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <b>Full Name</b>
                  </TableCell>
                  <TableCell>
                    <b>Email</b>
                  </TableCell>
                  <TableCell>
                    <b>Phone</b>
                  </TableCell>
                  <TableCell>
                    <b>Age</b>
                  </TableCell>
                  <TableCell>
                    <b>Student ID</b>
                  </TableCell>
                  <TableCell align="right">
                    <b>Actions</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedStudents.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>{student.fullName}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.phone || "N/A"}</TableCell>
                    <TableCell>
                      <ClientOnlyAge dob={student.dob} />
                    </TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewDetails(student)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack spacing={2} sx={{ mt: 2, alignItems: "flex-end" }}>
            <Pagination
              count={Math.ceil(filteredStudents.length / studentsPerPage)}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Stack>
        </>
      )}

      <Dialog open={!!selectedStudent} onClose={handleCloseDetails} fullWidth maxWidth="md">
        <DialogTitle>Details for {selectedStudent?.fullName}</DialogTitle>
        <DialogContent>
          {detailsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Subscription Details
              </Typography>
              {details.subscriptions.length > 0 ? (
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <b>Plan</b>
                        </TableCell>
                        <TableCell>
                          <b>Start Date</b>
                        </TableCell>
                        <TableCell>
                          <b>End Date</b>
                        </TableCell>
                        <TableCell>
                          <b>Status</b>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {details.subscriptions.map((sub, index) => (
                        <TableRow key={index}>
                          <TableCell>{sub.subscriptionId.name}</TableCell>
                          <TableCell>{new Date(sub.startDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(sub.expireDate).toLocaleDateString()}</TableCell>
                          <TableCell>{getStatusChip(sub.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>No subscriptions found.</Typography>
              )}

              <Typography variant="h6" gutterBottom>
                Transaction History
              </Typography>
              {details.transactions.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <b>Transaction ID</b>
                        </TableCell>
                        <TableCell>
                          <b>Amount</b>
                        </TableCell>
                        <TableCell>
                          <b>Date</b>
                        </TableCell>
                        <TableCell>
                          <b>Status</b>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {details.transactions.map((trx) => (
                        <TableRow key={trx._id}>
                          <TableCell>{trx.transactionId}</TableCell>
                          <TableCell>
                            {trx.amount} {trx.currency}
                          </TableCell>
                          <TableCell>
                            {new Date(trx.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{getStatusChip(trx.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>No transactions found.</Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentsView;