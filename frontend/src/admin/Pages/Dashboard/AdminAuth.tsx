import React, { useEffect, useState } from "react";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { Navigate } from "react-router-dom";
import { getAuthRole } from "../../../Config/Api";
import AdminLoginForm from "./AdminLoginForm";
import AdminSignupForm from "./AdminSignupForm";
import { useAppDispatch, useAppSelector } from "../../../State/Store";
import { clearAdminAuthError } from "../../../State/AdminAuthSlice";

const AdminAuth = () => {
  const dispatch = useAppDispatch();
  const admin = useAppSelector((state) => state.adminAuth.user);
  const authRole = getAuthRole();
  const [mode, setMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    dispatch(clearAdminAuthError());
  }, [dispatch]);

  if (authRole === "admin" && admin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 6, md: 10 }, mb: 6 }}>
      <Paper sx={{ borderRadius: "28px", border: "1px solid #e5e7eb", boxShadow: "none", overflow: "hidden" }}>
        <Box sx={{ p: 4, bgcolor: "#0f172a", color: "white" }}>
          <Typography variant="overline" sx={{ letterSpacing: "0.25em", fontWeight: 700 }}>
            ADMIN ACCESS
          </Typography>
          <Typography variant="h4" sx={{ mt: 1, fontWeight: 900 }}>
            {mode === "login" ? "Login to Admin Panel" : "Create Admin Account"}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "rgba(255,255,255,0.72)" }}>
            {mode === "login"
              ? "Restricted email + password access for platform administration."
              : "Create the first admin account or onboard a new administrator."}
          </Typography>
        </Box>

        {mode === "login" ? <AdminLoginForm /> : <AdminSignupForm />}

        <Box sx={{ px: 3, pb: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            {mode === "login"
              ? "Need to create an admin account first?"
              : "Already have an admin account?"}
          </Typography>
          <Button
            fullWidth
            sx={{ mt: 1, color: "#0f172a", fontWeight: "bold" }}
            onClick={() => {
              dispatch(clearAdminAuthError());
              setMode((current) => (current === "login" ? "signup" : "login"));
            }}
          >
            {mode === "login" ? "Create Admin Account" : "Back to Login"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminAuth;
