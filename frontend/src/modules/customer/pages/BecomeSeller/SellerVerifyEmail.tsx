import React, { useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "app/store/Store";
import { clearAuthError } from "../../../State/Seller/SellerAuthSlice";
import { verifySellerEmail } from "../../../State/Seller/SellerAuthThunks";

const SellerVerifyEmail = () => {
  const defaultEmail = useMemo(
    () => (typeof window !== "undefined" ? sessionStorage.getItem("pending_seller_email") || "" : ""),
    [],
  );
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [isVerified, setIsVerified] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, message } = useAppSelector((state) => state.sellerAuth);

  const handleVerify = async () => {
    if (!otp.trim() || !email.trim()) return;
    dispatch(clearAuthError());
    const result = await dispatch(
      verifySellerEmail({ otp: otp.trim(), email: email.trim() }),
    );
    if (verifySellerEmail.fulfilled.match(result)) {
      sessionStorage.removeItem("pending_seller_email");
      setIsVerified(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Box sx={{ width: "100%", maxWidth: 420, p: 4, boxShadow: 2, borderRadius: 2 }}>
        <Typography variant="h5" fontWeight={700} mb={1}>
          Verify Seller Email
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Enter email and OTP from your email to activate seller account.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

        <TextField
          fullWidth
          label="Seller Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
        />

        <TextField
          fullWidth
          label="Email OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          margin="normal"
        />

        {!isVerified ? (
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2, py: 1.3 }}
            disabled={loading || !otp.trim() || !email.trim()}
            onClick={handleVerify}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : "Verify Email"}
          </Button>
        ) : (
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2, py: 1.3 }}
            onClick={() => navigate("/become-seller?login=1")}
          >
            Go to Seller Login
          </Button>
        )}

        <Button
          fullWidth
          variant="text"
          sx={{ mt: 1 }}
          onClick={() => navigate("/become-seller")}
        >
          Back to Seller Page
        </Button>
      </Box>
    </div>
  );
};

export default SellerVerifyEmail;

