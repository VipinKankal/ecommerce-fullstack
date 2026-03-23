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
import { useNavigate } from 'react-router-dom';
import {
  fetchSellerProfile,
  sendLoginSignupOtp,
  signinSeller,
} from 'State/features/seller/auth/thunks';
import { clearAuthError } from 'State/features/seller/auth/slice';

const SellerLoginForm = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, message, otpSent } = useAppSelector(
    (state) => state.sellerAuth,
  );

  const formik = useFormik({
    initialValues: { email: '', otp: '' },
    onSubmit: async (values) => {
      const result = await dispatch(signinSeller(values));
      if (signinSeller.fulfilled.match(result)) {
        const jwt = (result.payload as { jwt?: string })?.jwt;
        await dispatch(fetchSellerProfile(jwt));
        navigate('/');
      }
    },
  });

  const handleSendOtp = () => {
    dispatch(clearAuthError());
    if (formik.values.email) {
      dispatch(sendLoginSignupOtp({ email: formik.values.email }));
    }
  };
  const otpButtonLabel =
    loading && !formik.values.otp ? null : otpSent ? 'Resend' : 'Send OTP';

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: 'auto',
        mt: 6,
        p: 3,
        boxShadow: 2,
        borderRadius: 2,
      }}
    >
      <Typography
        variant="h5"
        sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold', color: 'teal' }}
      >
        Seller Portal Login
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          label="Email Address"
          name="email"
          margin="normal"
          value={formik.values.email}
          onChange={formik.handleChange}
          disabled={otpSent && loading}
        />

        <TextField
          fullWidth
          label="6-Digit OTP"
          margin="normal"
          {...formik.getFieldProps('otp')}
          disabled={!otpSent}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    onClick={handleSendOtp}
                    disabled={loading || !formik.values.email}
                  >
                    {otpButtonLabel ? (
                      otpButtonLabel
                    ) : (
                      <CircularProgress size={20} />
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
          sx={{
            mt: 3,
            py: 1.5,
            bgcolor: 'teal',
            '&:hover': { bgcolor: '#00695c' },
          }}
          disabled={loading || !formik.values.otp}
        >
          {loading ? 'Verifying...' : 'Login to Dashboard'}
        </Button>
      </form>
    </Box>
  );
};

export default SellerLoginForm;

