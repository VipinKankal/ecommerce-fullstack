import React from 'react';
import { useFormik } from 'formik';
import {
  TextField,
  Button,
  Box,
  Typography,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';

import { useAppDispatch, useAppSelector } from 'app/store/Store';
import {
  getUserProfile,
  sendOtp,
  signinCustomer,
} from 'State/features/customer/auth/thunks';
import { clearError } from 'State/features/customer/auth/slice';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { loading, error, otpSent } = useAppSelector(
    (state) => state.customerAuth,
  );

  const formik = useFormik({
    initialValues: { email: '', otp: '' },
    onSubmit: async (values) => {
      const result = await dispatch(signinCustomer(values));
      if (signinCustomer.fulfilled.match(result)) {
        const jwt = (result.payload as { jwt?: string })?.jwt;
        await dispatch(getUserProfile(jwt));
        navigate('/');
      }
    },
  });

  const handleSendOtp = () => {
    dispatch(clearError());
    if (formik.values.email) {
      dispatch(sendOtp({ email: formik.values.email, isLogin: true }));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="900" textAlign="center" mb={3}>
        Login to Account
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.includes('user not exist')
            ? 'Account not found. Please switch to Register.'
            : error}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          label="Email Address"
          margin="normal"
          {...formik.getFieldProps('email')}
          disabled={loading || otpSent}
          error={formik.touched.email && !!formik.errors.email}
          helperText={formik.touched.email && formik.errors.email}
        />

        <TextField
          fullWidth
          label="6-Digit OTP"
          margin="normal"
          {...formik.getFieldProps('otp')}
          disabled={loading || !otpSent}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    onClick={handleSendOtp}
                    disabled={loading || !formik.values.email}
                  >
                    {loading && !otpSent ? (
                      <CircularProgress size={20} />
                    ) : otpSent ? (
                      'Resend'
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                </InputAdornment>
              ),
            },
          }}
        />

        <Button
          fullWidth
          variant="contained"
          type="submit"
          sx={{ mt: 3, py: 1.5, bgcolor: 'teal', fontWeight: 'bold' }}
          disabled={loading || !formik.values.otp}
        >
          {loading && otpSent ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Login'
          )}
        </Button>
      </form>
    </Box>
  );
};

export default LoginForm;
