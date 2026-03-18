import React, { useState } from "react";
import { Alert, Button, Paper, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { publicApi, setAuthToken } from "shared/api/Api";
import { API_ROUTES } from "shared/api/ApiRoutes";

const CourierLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setError(null);
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    try {
      await publicApi.post(API_ROUTES.auth.sendLoginSignupOtp, {
        email: `signing_${email.trim()}`,
        role: "ROLE_COURIER",
      });
      setStep("OTP");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    if (!otp.trim()) {
      setError("OTP is required");
      return;
    }
    setLoading(true);
    try {
      const response = await publicApi.post(API_ROUTES.auth.signin, {
        email: `courier_${email.trim()}`,
        otp: otp.trim(),
      });
      if (response.data?.jwt) {
        setAuthToken(response.data.jwt, "courier");
      } else if (typeof window !== "undefined") {
        sessionStorage.setItem("auth_role", "courier");
        sessionStorage.removeItem("auth_jwt");
      }
      navigate("/courier/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Paper elevation={2} className="w-full max-w-md p-6">
        <Typography variant="h5" className="font-bold">Courier Login</Typography>
        <Typography variant="body2" className="text-slate-500 mb-4">
          OTP login for courier partners
        </Typography>
        {error && <Alert severity="error" className="mb-4">{error}</Alert>}
        <TextField
          fullWidth
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={step === "OTP"}
          margin="normal"
        />
        {step === "OTP" && (
          <TextField
            fullWidth
            label="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            margin="normal"
          />
        )}
        {step === "EMAIL" ? (
          <Button fullWidth variant="contained" onClick={handleSendOtp} disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </Button>
        ) : (
          <Button fullWidth variant="contained" onClick={handleVerify} disabled={loading}>
            {loading ? "Verifying..." : "Verify & Login"}
          </Button>
        )}
      </Paper>
    </div>
  );
};

export default CourierLogin;
