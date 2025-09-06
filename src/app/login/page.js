"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
} from "@mui/material";
import Loader from "@/app/components/Loader";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

  useEffect(() => {
    // If the user is already logged in, redirect to the dashboard.
    if (sessionStorage.getItem("adminId")) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = `${baseURL}/api/getAdminDataWithEmail?email=${encodeURIComponent(
        email
      )}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-api-key": apiKey ?? "",
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status} ${text}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        if (result.data.password === password) {
          sessionStorage.setItem("adminId", result.data._id);
          router.replace("/dashboard"); // Use replace instead of push
        } else {
          setError("Invalid email or password.");
        }
      } else {
        setError("Invalid email or password.");
      }
    } catch (err) {
      console.error("Login API call failed:", err);
      setError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader />}
      <Container component="main" maxWidth="xs">
        <Paper elevation={3} sx={{ padding: 4, marginTop: 8 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography component="h1" variant="h5">
              Admin Login
            </Typography>
            <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
              {error && (
                <Typography color="error" align="center" sx={{ mb: 2 }}>
                  {error}
                </Typography>
              )}
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                // Pass the prop to the inner input element
                inputProps={{ suppressHydrationWarning: true }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // Pass the prop to the inner input element
                inputProps={{ suppressHydrationWarning: true }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </>
  );
}