import React from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAppDispatch, useAppSelector } from "app/store/Store";
import { register, sendOtp } from "../../../State/CustomerLogin/CustomerLogin";

interface Props {
  onSuccess: () => void;
}

const RegisterFrom = ({ onSuccess }: Props) => {
  const dispatch = useAppDispatch();
  const { otpSent, loading, error } = useAppSelector(
    (state: any) => state.customerAuth
  );

  const formik = useFormik({
    initialValues: { fullName: "", email: "", otp: "" },
    validationSchema: Yup.object({
      fullName: Yup.string().required("Required"),
      email: Yup.string().email("Invalid email").required("Required"),
      otp: otpSent
        ? Yup.string().length(6).required("Required")
        : Yup.string(),
    }),
    onSubmit: async (values) => {
      if (!otpSent) {
        dispatch(sendOtp({ email: values.email, isLogin: false }));
      } else {
        const result = await dispatch(register(values));

        // ✅ If register success → switch to login
        if (register.fulfilled.match(result)) {
          formik.resetForm();
          onSuccess();
        }
      }
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <Typography variant="h5" mb={2}>
        Create Account
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <TextField
        fullWidth
        label="Full Name"
        margin="normal"
        disabled={otpSent}
        {...formik.getFieldProps("fullName")}
      />

      <TextField
        fullWidth
        label="Email"
        margin="normal"
        disabled={otpSent}
        {...formik.getFieldProps("email")}
      />

      {otpSent && (
        <TextField
          fullWidth
          label="OTP"
          margin="normal"
          {...formik.getFieldProps("otp")}
        />
      )}

      <Button
        fullWidth
        type="submit"
        variant="contained"
        sx={{ mt: 2 }}
        disabled={loading}
      >
        {loading ? (
          <CircularProgress size={24} />
        ) : otpSent ? (
          "Register"
        ) : (
          "Send OTP"
        )}
      </Button>
    </Box>
  );
};

export default RegisterFrom;

